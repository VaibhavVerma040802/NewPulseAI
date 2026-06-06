from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, Any

from core.database import get_db
from models.user import User, RoleEnum
from models.article import Article, Summary
from core.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

@router.get("/analytics", response_model=Dict[str, Any])
def get_analytics(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_admin)  # Temporarily bypassed for MVP demonstration if needed, but PRD requires roles. We'll enable it.
    current_user: User = Depends(get_current_admin)
):
    total_users = db.query(func.count(User.user_id)).scalar()
    new_users = db.query(func.count(User.user_id)).filter(User.created_at >= func.now() - text("INTERVAL '24 HOURS'")).scalar()
    
    total_articles = db.query(func.count(Article.article_id)).scalar()
    total_summaries = db.query(func.count(Summary.summary_id)).scalar()
    
    return {
        "users": {
            "total": total_users,
            "new_24h": new_users or 0
        },
        "news": {
            "total_articles": total_articles
        },
        "ai": {
            "total_summaries": total_summaries
        }
    }
