from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class ProcessingStatusEnum(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class EmbeddingStatusEnum(str, Enum):
    PENDING = "PENDING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class ArticleBase(BaseModel):
    title: str
    url: str
    source_name: str
    source_domain: str
    category: str
    language: str = "en"
    published_at: datetime
    content: Optional[str] = None
    snippet: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    is_duplicate: bool = False

class ArticleCreate(ArticleBase):
    pass

class SentimentResponse(BaseModel):
    headline_sentiment: str
    headline_score: float
    body_sentiment: str
    body_score: float
    compound_score: Optional[float]
    model_used: Optional[str]

    model_config = {"from_attributes": True}

class CredibilityResponse(BaseModel):
    score: float
    source_reputation_score: float
    cross_source_score: float
    consistency_score: float

    model_config = {"from_attributes": True}

class EntityResponse(BaseModel):
    entity_text: str
    entity_label: str
    frequency: int

    model_config = {"from_attributes": True}

class ArticleResponse(ArticleBase):
    article_id: UUID
    fetched_at: datetime
    processing_status: ProcessingStatusEnum
    embedding_status: EmbeddingStatusEnum
    view_count: int
    
    sentiment: Optional[SentimentResponse] = None
    credibility: Optional[CredibilityResponse] = None
    entities: Optional[list[EntityResponse]] = None

    model_config = {"from_attributes": True}
