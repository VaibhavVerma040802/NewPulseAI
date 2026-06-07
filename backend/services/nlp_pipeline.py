import logging
from typing import List, Optional, Literal
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import concurrent.futures

from core.config import get_settings
from models.article import (
    Article, Summary, SentimentAnalysis, ArticleEntity, CredibilityScore,
    SummaryTypeEnum, SentimentEnum, ProcessingStatusEnum
)

# Using langchain to easily enforce structured output from Gemini
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser

logger = logging.getLogger(__name__)
settings = get_settings()

# Define output schemas for Gemini structured responses

class SentimentResult(BaseModel):
    headline_sentiment: Literal["POSITIVE", "NEGATIVE", "NEUTRAL"] = Field(description="Sentiment of the headline")
    headline_score: float = Field(description="Confidence score for headline sentiment (0.0 to 1.0)")
    body_sentiment: Literal["POSITIVE", "NEGATIVE", "NEUTRAL"] = Field(description="Sentiment of the article body")
    body_score: float = Field(description="Confidence score for body sentiment (0.0 to 1.0)")
    compound_score: float = Field(description="Overall sentiment score between -1.0 and 1.0")

class EntityItem(BaseModel):
    entity_text: str = Field(description="The exact text of the entity found")
    entity_label: str = Field(description="The type of entity (e.g., PERSON, ORG, LOC, EVENT)")

class EntityExtractionResult(BaseModel):
    entities: List[EntityItem]

class SummaryResult(BaseModel):
    summary_text: str = Field(description="The generated summary")

class CredibilityResult(BaseModel):
    score: float = Field(description="A score between 0.0 and 100.0 evaluating the overall credibility.")
    source_reputation_score: float = Field(description="Score between 0.0 and 100.0 evaluating source reputation.")
    cross_source_score: float = Field(description="Score between 0.0 and 100.0 evaluating cross-source corroboration.")
    consistency_score: float = Field(description="Score between 0.0 and 100.0 evaluating internal consistency.")

class NLPPipeline:
    def __init__(self, db: Session):
        self.db = db
        import random
        # Initialize Gemini LLM with structured output capabilities
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=random.choice(settings.get_gemini_keys()),
            temperature=0.2
        )

    def process_article(self, article_id: str) -> bool:
        """Runs the entire NLP pipeline for a single article."""
        article = self.db.query(Article).filter(Article.article_id == article_id).first()
        if not article:
            logger.error(f"Article not found: {article_id}")
            return False
            
        if not article.content and not article.snippet:
            logger.warning(f"No content to process for article: {article_id}")
            return False
            
        text_to_process = f"Title: {article.title}\n\nContent: {article.content or article.snippet}"
        
        try:
            article.processing_status = ProcessingStatusEnum.PROCESSING
            self.db.commit()
            
            # Use ThreadPoolExecutor to run LLM calls concurrently to avoid 10s timeout on Vercel
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                # Submit all tasks
                f1 = executor.submit(self._generate_summary_task, text_to_process)
                f2 = executor.submit(self._analyze_sentiment_task, text_to_process)
                f3 = executor.submit(self._extract_entities_task, text_to_process)
                f4 = executor.submit(self._analyze_credibility_task, text_to_process)
                
                # Wait for all to complete
                summary_result = f1.result()
                sentiment_result = f2.result()
                entity_result = f3.result()
                credibility_result = f4.result()
            
            summary = Summary(
                article_id=article.article_id,
                summary_type=SummaryTypeEnum.QUICK,
                summary_text=summary_result.summary_text,
                model_used="gemini-2.5-flash"
            )
            self.db.add(summary)
            
            sentiment = SentimentAnalysis(
                article_id=article.article_id,
                headline_sentiment=sentiment_result.headline_sentiment,
                headline_score=sentiment_result.headline_score,
                body_sentiment=sentiment_result.body_sentiment,
                body_score=sentiment_result.body_score,
                compound_score=sentiment_result.compound_score,
                model_used="gemini-2.5-flash"
            )
            self.db.add(sentiment)
            
            entity_freq = {}
            for ent in entity_result.entities:
                key = (ent.entity_text, ent.entity_label)
                entity_freq[key] = entity_freq.get(key, 0) + 1
                
            for (ent_text, ent_label), freq in entity_freq.items():
                entity = ArticleEntity(
                    article_id=article.article_id,
                    entity_text=ent_text,
                    entity_label=ent_label,
                    frequency=freq
                )
                self.db.add(entity)
                
            credibility = CredibilityScore(
                article_id=article.article_id,
                score=credibility_result.score,
                source_reputation_score=credibility_result.source_reputation_score,
                cross_source_score=credibility_result.cross_source_score,
                consistency_score=credibility_result.consistency_score
            )
            self.db.add(credibility)
            
            article.processing_status = ProcessingStatusEnum.COMPLETE
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to process article {article_id}: {str(e)}")
            self.db.rollback()
            try:
                article.processing_status = ProcessingStatusEnum.FAILED
                self.db.commit()
            except Exception as e2:
                self.db.rollback()
            return False

    def _generate_summary_task(self, text: str) -> SummaryResult:
        parser = PydanticOutputParser(pydantic_object=SummaryResult)
        prompt = f"Provide a concise, 3-4 sentence summary of the following article:\n\n{text}\n\n{parser.get_format_instructions()}"
        response = self.llm.invoke(prompt)
        return parser.invoke(response)

    def _analyze_sentiment_task(self, text: str) -> SentimentResult:
        parser = PydanticOutputParser(pydantic_object=SentimentResult)
        prompt = f"Analyze the sentiment of the headline and body of this article. Also provide an overall compound score between -1.0 (very negative) and 1.0 (very positive):\n\n{text}\n\n{parser.get_format_instructions()}"
        response = self.llm.invoke(prompt)
        return parser.invoke(response)

    def _extract_entities_task(self, text: str) -> EntityExtractionResult:
        parser = PydanticOutputParser(pydantic_object=EntityExtractionResult)
        prompt = f"Extract all key entities (People, Organizations, Locations, Events) mentioned in this article:\n\n{text}\n\n{parser.get_format_instructions()}"
        response = self.llm.invoke(prompt)
        return parser.invoke(response)

    def _analyze_credibility_task(self, text: str) -> CredibilityResult:
        parser = PydanticOutputParser(pydantic_object=CredibilityResult)
        prompt = f"Evaluate the credibility of this article based on journalistic standards, source reputation (if apparent), and content consistency. Provide a score between 0.0 and 100.0:\n\n{text}\n\n{parser.get_format_instructions()}"
        response = self.llm.invoke(prompt)
        return parser.invoke(response)
