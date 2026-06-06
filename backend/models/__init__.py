from core.database import Base
from .user import User
from .article import Article, Summary, SentimentAnalysis, CredibilityScore, ArticleEntity
from .interaction import UserBookmark, UserReadingList, ReadingListArticle, UserInterest, UserReadHistory, ChatHistory
from .auth import VerificationToken, RefreshToken, AuditLog

# Expose Base and all models so Alembic can import them easily
__all__ = [
    "Base",
    "User",
    "Article",
    "Summary",
    "SentimentAnalysis",
    "CredibilityScore",
    "ArticleEntity",
    "UserBookmark",
    "UserReadingList",
    "ReadingListArticle",
    "UserInterest",
    "UserReadHistory",
    "ChatHistory",
    "VerificationToken",
    "RefreshToken",
    "AuditLog"
]
