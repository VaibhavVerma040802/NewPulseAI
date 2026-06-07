from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, Any

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from models.interaction import UserReadHistory
from models.article import Article, ArticleEntity, CredibilityScore

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me/dashboard", response_model=Dict[str, Any])
def get_user_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Total Articles Read
    articles_read = db.query(func.count(UserReadHistory.history_id)).filter(UserReadHistory.user_id == current_user.user_id).scalar() or 0
    
    # 2. Time Saved (Estimate: 5 mins per article read)
    time_saved_mins = articles_read * 5
    time_saved_hrs = time_saved_mins // 60
    time_saved_display = f"{time_saved_hrs} hrs" if time_saved_hrs > 0 else f"{time_saved_mins} mins"

    # 3. Entities Tracked (Unique entities from read articles)
    entities_tracked = db.query(func.count(func.distinct(ArticleEntity.entity_id)))\
        .join(Article, Article.article_id == ArticleEntity.article_id)\
        .join(UserReadHistory, UserReadHistory.article_id == Article.article_id)\
        .filter(UserReadHistory.user_id == current_user.user_id).scalar() or 0

    # 4. Avg Credibility
    avg_credibility = db.query(func.avg(CredibilityScore.score))\
        .join(UserReadHistory, UserReadHistory.article_id == CredibilityScore.article_id)\
        .filter(UserReadHistory.user_id == current_user.user_id).scalar() or 0
    avg_credibility = int(avg_credibility * 100) if avg_credibility > 0 else 0

    # 5. Reading Activity (Last 7 Days)
    # We will get counts grouped by day, then map them to the past 7 days
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    last_7_days_dates = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    activity_dict = {}
    
    last_7_days_query = db.query(
        func.date(UserReadHistory.read_at).label('read_date'),
        func.count(UserReadHistory.history_id).label('count')
    ).filter(
        UserReadHistory.user_id == current_user.user_id,
        UserReadHistory.read_at >= func.now() - text("INTERVAL '7 DAYS'")
    ).group_by('read_date').all()
    
    for row in last_7_days_query:
        activity_dict[row.read_date] = row.count
        
    activity_data = []
    for d in last_7_days_dates:
        # Scale for UI if needed, but keeping actual count is more accurate.
        # The frontend expects values to plot. Let's just use the raw count.
        activity_data.append(activity_dict.get(d, 0))

    # 6. Top Topics
    # Count categories of read articles
    top_topics_query = db.query(
        Article.category,
        func.count(Article.article_id).label('count')
    ).join(UserReadHistory, UserReadHistory.article_id == Article.article_id)\
    .filter(UserReadHistory.user_id == current_user.user_id)\
    .group_by(Article.category)\
    .order_by(func.count(Article.article_id).desc())\
    .limit(4).all()

    top_topics = []
    colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"]
    total_cat_count = sum(t.count for t in top_topics_query) if top_topics_query else 1
    
    for i, t in enumerate(top_topics_query):
        percent = int((t.count / total_cat_count) * 100)
        top_topics.append([t.category, percent, colors[i % len(colors)]])
    
    # 7. Bookmarks count
    from models.interaction import UserBookmark
    bookmarks_count = db.query(func.count(UserBookmark.bookmark_id)).filter(
        UserBookmark.user_id == current_user.user_id
    ).scalar() or 0
    
    # 8. Trending topics from the DB (most frequent entities overall)
    from models.article import ArticleEntity as AE
    trending_query = db.query(
        AE.entity_text,
        func.sum(AE.frequency).label('total_freq')
    ).group_by(AE.entity_text).order_by(func.sum(AE.frequency).desc()).limit(5).all()
    
    trending_topics = [{"name": e.entity_text, "rank": i + 1} for i, e in enumerate(trending_query)]
    
    # 9. Today's sentiment breakdown (across all articles with sentiment data)
    from models.article import SentimentAnalysis, SentimentEnum
    from sqlalchemy import case
    total_sentiment = db.query(func.count(SentimentAnalysis.sentiment_id)).scalar() or 1
    positive_count = db.query(func.count(SentimentAnalysis.sentiment_id)).filter(SentimentAnalysis.headline_sentiment == SentimentEnum.POSITIVE).scalar() or 0
    negative_count = db.query(func.count(SentimentAnalysis.sentiment_id)).filter(SentimentAnalysis.headline_sentiment == SentimentEnum.NEGATIVE).scalar() or 0
    neutral_count = total_sentiment - positive_count - negative_count
    
    sentiment_breakdown = {
        "positive": round((positive_count / total_sentiment) * 100),
        "negative": round((negative_count / total_sentiment) * 100),
        "neutral": round((neutral_count / total_sentiment) * 100)
    }

    return {
        "articles_read": articles_read,
        "time_saved_minutes": time_saved_mins,
        "entities_tracked": entities_tracked,
        "avg_credibility": avg_credibility,
        "bookmarks_count": bookmarks_count,
        "queries": 0,  # Chat query count not tracked yet
        "stats": [
            ["Articles Read", str(articles_read), ""],
            ["Entities Tracked", str(entities_tracked), ""],
            ["Time Saved", time_saved_display, ""],
            ["Avg Credibility", f"{avg_credibility}/100", ""]
        ],
        "activity": activity_data,
        "top_topics": top_topics,
        "trending_topics": trending_topics,
        "sentiment_breakdown": sentiment_breakdown
    }

@router.get("/me/stats", response_model=Dict[str, Any])
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alias for /me/dashboard for backward compatibility."""
    return get_user_dashboard(db=db, current_user=current_user)



from pydantic import BaseModel
from typing import List

class UpdateInterestsRequest(BaseModel):
    categories: List[str]

@router.post("/me/interests")
def update_interests(
    req: UpdateInterestsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from models.interaction import UserInterest
    db.query(UserInterest).filter(UserInterest.user_id == current_user.user_id).delete()
    
    for category in req.categories:
        interest = UserInterest(user_id=current_user.user_id, category=category)
        db.add(interest)
        
    db.commit()
    return {"message": "Interests updated successfully"}
    
@router.get("/me/interests", response_model=List[str])
def get_interests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from models.interaction import UserInterest
    interests = db.query(UserInterest).filter(UserInterest.user_id == current_user.user_id).all()
    return [i.category for i in interests]
