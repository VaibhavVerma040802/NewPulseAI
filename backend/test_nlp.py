import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.article import Article
from services.nlp_pipeline import NLPPipeline

def test_nlp():
    db = SessionLocal()
    try:
        # Find an article without a summary
        article = db.query(Article).filter(Article.content != None).first()
        if not article:
            print("No articles with content found")
            return
            
        print(f"Testing NLP on article: {article.title}")
        pipeline = NLPPipeline(db)
        
        try:
            success = pipeline.process_article(str(article.article_id))
            print(f"Success: {success}")
        except Exception as e:
            print(f"Exception during pipeline: {e}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_nlp()
