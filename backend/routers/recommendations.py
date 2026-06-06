from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from services.vector_store import VectorStoreService
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from models.interaction import UserBookmark
from models.article import Article
from schemas.article import ArticleResponse

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

def get_vector_store():
    return VectorStoreService()

@router.get("/search")
def search_articles(
    query: str = Query(..., description="The topic or keywords to search for"),
    limit: int = Query(5, ge=1, le=20),
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """
    Search for relevant articles based on semantic similarity.
    """
    results = vector_store.similarity_search(query, k=limit)
    return {"results": results}

@router.get("/personalized", response_model=List[ArticleResponse])
def get_personalized_recommendations(
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStoreService = Depends(get_vector_store)
):
    """
    Get personalized news recommendations for the user based on their bookmarks.
    """
    # 1. Get user's most recent bookmarks
    recent_bookmarks = db.query(UserBookmark).filter(
        UserBookmark.user_id == current_user.user_id
    ).order_by(desc(UserBookmark.created_at)).limit(3).all()
    
    if not recent_bookmarks:
        # Fallback: Just return latest articles
        return db.query(Article).order_by(desc(Article.published_at)).limit(limit).all()
        
    # 2. Get the articles for those bookmarks
    bookmarked_article_ids = [b.article_id for b in recent_bookmarks]
    bookmarked_articles = db.query(Article).filter(Article.article_id.in_(bookmarked_article_ids)).all()
    
    # 3. Build a combined query string from the titles
    query_text = " ".join([a.title for a in bookmarked_articles])
    
    # 4. Perform semantic search
    search_results = vector_store.similarity_search(query_text, k=limit + len(bookmarked_article_ids))
    
    # 5. Extract article IDs from metadata, excluding already bookmarked ones
    recommended_ids = []
    for res in search_results:
        aid = res["metadata"].get("article_id")
        if aid and str(aid) not in [str(id) for id in bookmarked_article_ids]:
            recommended_ids.append(aid)
            
    if not recommended_ids:
        return db.query(Article).order_by(desc(Article.published_at)).limit(limit).all()
        
    # 6. Fetch the actual articles from DB
    recommended_articles = db.query(Article).filter(Article.article_id.in_(recommended_ids)).all()
    
    # Sort them by the order returned by ChromaDB (by similarity score implicitly)
    article_dict = {str(a.article_id): a for a in recommended_articles}
    sorted_recommendations = []
    for aid in recommended_ids:
        if aid in article_dict:
            sorted_recommendations.append(article_dict[aid])
            
    return sorted_recommendations[:limit]
