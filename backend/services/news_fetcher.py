import feedparser
import requests
import logging
from datetime import datetime, timezone
from dateutil import parser as date_parser
from typing import List, Dict, Any
from urllib.parse import urlparse

from core.config import get_settings
from schemas.article import ArticleCreate

logger = logging.getLogger(__name__)
settings = get_settings()

class NewsFetcher:
    """Base class or utility for fetching news."""
    
    @staticmethod
    def _parse_date(date_str: str) -> datetime:
        try:
            dt = date_parser.parse(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception as e:
            logger.error(f"Error parsing date {date_str}: {e}")
            return datetime.now(timezone.utc)
            
    @staticmethod
    def _extract_domain(url: str) -> str:
        try:
            return urlparse(url).netloc.replace("www.", "")
        except:
            return "unknown.com"

class CurrentsApiFetcher(NewsFetcher):
    """Fetches news from Currents API (free tier)."""
    
    BASE_URL = "https://api.currentsapi.services/v1"
    
    def fetch_top_headlines(self, category: str = "general", language: str = "en") -> List[ArticleCreate]:
        if not settings.CURRENTS_API_KEY:
            logger.warning("CURRENTS_API_KEY is not set. Skipping Currents API fetcher.")
            return []
            
        # Currents API uses different category strings occasionally, but 'general', 'technology', etc., usually match well.
        # They don't support 'entertainment' directly without mapping if they changed it, but standard categories usually work.
        
        logger.info(f"Fetching Currents API top headlines (category: {category})")
        articles: List[ArticleCreate] = []
        
        try:
            url = f"{self.BASE_URL}/latest-news"
            params = {
                "apiKey": settings.CURRENTS_API_KEY,
                "category": category,
                "language": language
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "ok":
                for item in data.get("news", []):
                    # Skip articles missing a URL
                    if not item.get("url"):
                        continue
                        
                    published_at = self._parse_date(item.get("published", ""))
                    
                    article = ArticleCreate(
                        title=item.get("title", ""),
                        url=item.get("url", ""),
                        source_name=item.get("author", "Unknown Source") if item.get("author") else "Unknown Source",
                        source_domain=self._extract_domain(item.get("url", "")),
                        category=category,
                        language=language,
                        published_at=published_at,
                        content=item.get("description"),
                        snippet=item.get("description", "")[:990],
                        image_url=item.get("image") if item.get("image") and str(item.get("image")).startswith("http") else None,
                        author=item.get("author")
                    )
                    articles.append(article)
            else:
                logger.error(f"Currents API returned error: {data.get('message', 'Unknown Error')}")
                
        except Exception as e:
            logger.error(f"Failed to fetch Currents API: {e}")
            
        return articles
