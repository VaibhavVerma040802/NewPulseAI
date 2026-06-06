from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from models.article import Article
import logging

logger = logging.getLogger(__name__)

class Deduplicator:
    def __init__(self, db: Session):
        self.db = db

    def is_duplicate(self, url: str, title: str, source_domain: str, published_at: datetime) -> bool:
        """
        Check if an article is a duplicate based on URL or similar content recently published.
        Returns True if it's a duplicate, False otherwise.
        """
        # 1. Exact URL match - definite duplicate
        existing_by_url = self.db.query(Article).filter(Article.url == url).first()
        if existing_by_url:
            logger.info(f"Duplicate found by URL: {url}")
            return True

        # 2. Same Title and Source within the last 48 hours
        time_threshold = published_at - timedelta(hours=48)
        
        # Simple exact title match for now. Could be upgraded to fuzzy matching or semantic similarity later.
        existing_by_title = self.db.query(Article).filter(
            Article.title == title,
            Article.source_domain == source_domain,
            Article.published_at >= time_threshold
        ).first()
        
        if existing_by_title:
            logger.info(f"Duplicate found by Title and Source: '{title}' from {source_domain}")
            return True
            
        return False
