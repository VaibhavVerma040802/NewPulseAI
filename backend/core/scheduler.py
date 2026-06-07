import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from core.database import SessionLocal
from services.news_fetcher import CurrentsApiFetcher
from services.deduplicator import Deduplicator
from services.nlp_pipeline import NLPPipeline
from services.vector_store import VectorStoreService
from models.article import Article

logger = logging.getLogger(__name__)

def fetch_and_process_news():
    """
    Background job to fetch, deduplicate, save, process NLP, and embed articles.
    """
    logger.info("Starting scheduled news fetch job...")
    db: Session = SessionLocal()
    
    try:
        # Initialize services
        currents_api = CurrentsApiFetcher()
        deduplicator = Deduplicator(db)
        nlp_pipeline = NLPPipeline(db)
        vector_store = VectorStoreService(db)
        
        # 1. Fetch from all sources across multiple categories
        categories = ["general", "technology", "business", "sports", "health", "entertainment", "science"]
        all_articles = []
        
        for category in categories:
            # Fetch from Currents API
            all_articles.extend(currents_api.fetch_top_headlines(category=category))
        
        logger.info(f"Fetched {len(all_articles)} total articles from Currents API.")
        
        new_count = 0
        
        # 2. Process each article
        for article_data in all_articles:
            # Deduplication
            if deduplicator.is_duplicate(
                url=article_data.url, 
                title=article_data.title, 
                source_domain=article_data.source_domain, 
                published_at=article_data.published_at
            ):
                continue
                
            # Create new Article in DB
            new_article = Article(
                title=article_data.title[:500] if article_data.title else None,
                url=article_data.url[:2000] if article_data.url else None,
                source_name=article_data.source_name[:200] if article_data.source_name else None,
                source_domain=article_data.source_domain[:200] if article_data.source_domain else None,
                category=article_data.category[:50] if article_data.category else "general",
                language=article_data.language[:2] if article_data.language else "en",
                published_at=article_data.published_at,
                content=article_data.content,
                snippet=article_data.snippet[:990] + "..." if article_data.snippet and len(article_data.snippet) > 1000 else article_data.snippet,
                image_url=article_data.image_url[:2000] if article_data.image_url else None,
                author=article_data.author[:300] if article_data.author else None
            )
            
            try:
                db.add(new_article)
                db.commit()
                new_count += 1
            except Exception as e_article:
                logger.error(f"Error saving article {article_data.url}: {str(e_article)}")
                db.rollback()
                
        logger.info(f"Finished fetching phase. Added {new_count} new raw articles.")
        
        # 3. Process NLP queue for newly added articles
        # Process a small batch per run to stay within Gemini free-tier limits
        from models.article import ProcessingStatusEnum
        pending_articles = db.query(Article).filter(
            Article.processing_status == ProcessingStatusEnum.PENDING
        ).order_by(Article.published_at.desc()).limit(3).all()
        
        processed_count = 0
        for article in pending_articles:
            try:
                # NLP Pipeline (Summarization, Sentiment, Entities, Credibility)
                success = nlp_pipeline.process_article(str(article.article_id))
                if success:
                    # ChromaDB Embeddings for search
                    vector_store.embed_article(article)
                    processed_count += 1
            except Exception as e_proc:
                logger.error(f"Error in background NLP processing for {article.article_id}: {str(e_proc)}")
                
        logger.info(f"Finished scheduled job. Background processed {processed_count} articles.")
        
    except Exception as e:
        logger.error(f"Error in scheduled news fetch job: {str(e)}")
    finally:
        db.close()


def start_scheduler():
    """Initializes and starts the APScheduler."""
    scheduler = BackgroundScheduler()
    
    # Run the fetch job every 1 minute
    scheduler.add_job(
        fetch_and_process_news,
        trigger=IntervalTrigger(minutes=1),
        id="fetch_news_job",
        name="Fetch and process latest news",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("APScheduler started successfully.")
    return scheduler
