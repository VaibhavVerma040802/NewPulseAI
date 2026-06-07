from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from core.database import get_db
from models.article import Article, Summary, ArticleEntity
from schemas.article import ArticleResponse
from core.dependencies import get_current_user
from models.user import User
from core.scheduler import fetch_and_process_news
from services.nlp_pipeline import NLPPipeline
from services.vector_store import VectorStoreService

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/trending")
def get_trending_news(db: Session = Depends(get_db)) -> Any:
    """
    Retrieve trending entities to serve the UI sidebar.
    """
    # Fetch most frequent entities across all articles
    top_entities_query = db.query(
        ArticleEntity.entity_text,
        func.sum(ArticleEntity.frequency).label('total_freq')
    ).group_by(ArticleEntity.entity_text)\
    .order_by(func.sum(ArticleEntity.frequency).desc())\
    .limit(4).all()

    trending = []
    
    # Calculate total frequency to generate a real percentage trend
    total_mentions = sum(e.total_freq for e in top_entities_query) if top_entities_query else 1
    
    for e in top_entities_query:
        # Calculate real percentage relative to top mentions
        percent = int((e.total_freq / total_mentions) * 100)
        trend_val = f"+{percent}%" if percent > 0 else "Active"
        trending.append({
            "name": e.entity_text,
            "trend": trend_val
        })
    
    return trending

@router.get("/public", response_model=List[ArticleResponse])
def get_public_news(
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve limited articles for the public landing page (Guests).
    """
    articles = db.query(Article).filter(Article.is_duplicate == False).order_by(Article.published_at.desc()).limit(6).all()
    return articles

@router.get("", response_model=List[ArticleResponse])
def get_news(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = None,
    current_user: User = Depends(get_current_user) # Secured for Users
) -> Any:
    """
    Retrieve articles.
    """
    query = db.query(Article).filter(Article.is_duplicate == False)
    
    if category:
        from sqlalchemy import func
        query = query.filter(func.lower(Article.category) == category.lower())
        
    articles = query.order_by(Article.published_at.desc()).offset(skip).limit(limit).all()
    return articles

@router.post("/fetch")
def trigger_manual_fetch(background_tasks: BackgroundTasks):
    """
    Manually trigger the news fetching and processing pipeline in the background.
    """
    background_tasks.add_task(fetch_and_process_news)
    return {"message": "News fetch and processing job started in the background."}

@router.get("/{article_id}/summary")
def get_article_summary(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve the AI summary for a specific article.
    """
    summary = db.query(Summary).filter(Summary.article_id == article_id).first()
    
    if not summary:
        # Trigger the pipeline dynamically if the summary doesn't exist
        pipeline = NLPPipeline(db)
        success = pipeline.process_article(article_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to generate summary dynamically.")
        
        # Fetch the newly generated summary
        summary = db.query(Summary).filter(Summary.article_id == article_id).first()
        if not summary:
            raise HTTPException(status_code=500, detail="Summary generated but could not be retrieved.")
    
    
    return {"summary": summary.summary_text, "model": summary.model_used, "type": summary.summary_type}

@router.post("/{article_id}/process")
def trigger_article_processing(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Manually triggers the NLP pipeline for a single article to generate summary, sentiment, etc.
    """
    pipeline = NLPPipeline(db)
    success = pipeline.process_article(article_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to process article.")
    return {"message": "Processing complete. Please refresh the page."}

def get_vector_store():
    return VectorStoreService()

@router.get("/{article_id}/timeline", response_model=List[ArticleResponse])
def get_article_timeline(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStoreService = Depends(get_vector_store)
) -> Any:
    """
    Generate an event timeline by finding related articles and sorting them chronologically.
    """
    article = db.query(Article).filter(Article.article_id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
        
    query_text = f"{article.title} {article.content or article.snippet}"
    
    # 1. Search for related articles (including the current one)
    search_results = vector_store.similarity_search(query_text, k=6)
    
    related_ids = []
    for res in search_results:
        aid = res["metadata"].get("article_id")
        if aid:
            related_ids.append(aid)
            
    if not related_ids:
        return [article]
        
    # 2. Fetch the actual articles
    related_articles = db.query(Article).filter(Article.article_id.in_(related_ids)).order_by(Article.published_at.asc()).all()
    
    return related_articles
