import os
import logging
from typing import List, Dict, Any
from langchain_postgres import PGVector
from langchain_postgres.vectorstores import PGVector
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from core.config import get_settings
from models.article import Article, EmbeddingStatusEnum

logger = logging.getLogger(__name__)
settings = get_settings()

class VectorStoreService:
    def __init__(self, db: Session = None):
        self.db = db
        self.collection_name = "articles"
        
        # Initialize Gemini Embeddings
        import random
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=random.choice(settings.get_gemini_keys())
        )
        
        # We need a psycopg3 compatible connection string for langchain-postgres.
        # Replace postgresql:// with postgresql+psycopg://
        conn_str = settings.SUPABASE_DB_URL
        if conn_str.startswith("postgresql://"):
            conn_str = conn_str.replace("postgresql://", "postgresql+psycopg://", 1)
        
        # Initialize LangChain PGVector integration
        try:
            self.vector_store = PGVector(
                embeddings=self.embeddings,
                collection_name=self.collection_name,
                connection=conn_str,
                use_jsonb=True,
            )
        except Exception as e:
            logger.error(f"Failed to initialize PGVector: {e}")
            self.vector_store = None

    def embed_article(self, article: Article) -> bool:
        """Embeds an article's content and stores it in PGVector."""
        if not self.vector_store:
            logger.error("Vector store not initialized.")
            return False

        if not article.content and not article.snippet:
            logger.warning(f"No content to embed for article: {article.article_id}")
            return False
            
        text_to_embed = f"Title: {article.title}\n\n{article.content or article.snippet}"
        metadata = {
            "article_id": str(article.article_id),
            "title": article.title,
            "source": article.source_domain or "",
            "category": article.category or ""
        }
        
        try:
            # We add documents to the PGVector store
            self.vector_store.add_texts(
                texts=[text_to_embed],
                metadatas=[metadata],
                ids=[str(article.article_id)]
            )
            
            # Update database status
            if self.db:
                article.embedding_status = EmbeddingStatusEnum.COMPLETE
                self.db.commit()
                
            return True
        except Exception as e:
            logger.error(f"Failed to embed article {article.article_id}: {str(e)}")
            if self.db:
                article.embedding_status = EmbeddingStatusEnum.FAILED
                self.db.commit()
            return False

    def similarity_search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Searches for articles semantically similar to the query."""
        if not self.vector_store:
            logger.error("Vector store not initialized.")
            return []

        try:
            results = self.vector_store.similarity_search_with_score(query, k=k)
            # Format results
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": score
                })
            return formatted_results
        except Exception as e:
            logger.error(f"Similarity search failed: {str(e)}")
            return []
