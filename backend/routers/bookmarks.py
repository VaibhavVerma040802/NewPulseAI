from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from pydantic import BaseModel

from core.database import get_db
from models.user import User
from models.article import Article
from models.interaction import UserBookmark
from schemas.article import ArticleResponse
from core.dependencies import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])

class BookmarkRequest(BaseModel):
    article_id: str

@router.get("", response_model=List[ArticleResponse])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    bookmarks = db.query(UserBookmark).filter(UserBookmark.user_id == current_user.user_id).all()
    article_ids = [b.article_id for b in bookmarks]
    articles = db.query(Article).filter(Article.article_id.in_(article_ids)).all()
    return articles

@router.post("")
def toggle_bookmark(
    req: BookmarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    bookmark = db.query(UserBookmark).filter(
        UserBookmark.user_id == current_user.user_id,
        UserBookmark.article_id == req.article_id
    ).first()
    
    if bookmark:
        db.delete(bookmark)
        db.commit()
        return {"status": "removed"}
    else:
        new_bookmark = UserBookmark(
            user_id=current_user.user_id,
            article_id=req.article_id
        )
        db.add(new_bookmark)
        db.commit()
        return {"status": "added"}
