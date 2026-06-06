from sqlalchemy import Column, String, Boolean, DateTime, Enum, text, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
import enum

class ProcessingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class EmbeddingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class SummaryTypeEnum(str, enum.Enum):
    QUICK = "QUICK"
    DETAILED = "DETAILED"
    EXECUTIVE = "EXECUTIVE"
    BULLETS = "BULLETS"
    DIGEST = "DIGEST"

class SentimentEnum(str, enum.Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"

class Article(Base):
    __tablename__ = "articles"

    article_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    snippet = Column(String(1000), nullable=True)
    url = Column(String(2000), nullable=False, unique=True)
    source_name = Column(String(200), nullable=False)
    source_domain = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    language = Column(String(2), nullable=False, default="en", index=True)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    fetched_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    image_url = Column(String(2000), nullable=True)
    author = Column(String(300), nullable=True)
    is_duplicate = Column(Boolean, nullable=False, default=False, index=True)
    processing_status = Column(Enum(ProcessingStatusEnum), nullable=False, default=ProcessingStatusEnum.PENDING)
    embedding_status = Column(Enum(EmbeddingStatusEnum), nullable=False, default=EmbeddingStatusEnum.PENDING)
    view_count = Column(Integer, nullable=False, default=0)
    
    summaries = relationship("Summary", back_populates="article", cascade="all, delete-orphan")
    sentiment = relationship("SentimentAnalysis", back_populates="article", uselist=False, cascade="all, delete-orphan")
    credibility = relationship("CredibilityScore", back_populates="article", uselist=False, cascade="all, delete-orphan")
    entities = relationship("ArticleEntity", back_populates="article", cascade="all, delete-orphan")


class Summary(Base):
    __tablename__ = "summaries"

    summary_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"))
    summary_type = Column(Enum(SummaryTypeEnum), nullable=False)
    summary_text = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=text("now()"))
    generation_ms = Column(Integer, nullable=True)
    token_count_input = Column(Integer, nullable=True)
    token_count_output = Column(Integer, nullable=True)

    article = relationship("Article", back_populates="summaries")


class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"

    sentiment_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"))
    headline_sentiment = Column(Enum(SentimentEnum), nullable=False)
    headline_score = Column(Float, nullable=False)
    body_sentiment = Column(Enum(SentimentEnum), nullable=False)
    body_score = Column(Float, nullable=False)
    compound_score = Column(Float, nullable=True)
    model_used = Column(String(100), nullable=True)
    analyzed_at = Column(DateTime(timezone=True), server_default=text("now()"))
    
    article = relationship("Article", back_populates="sentiment")


class CredibilityScore(Base):
    __tablename__ = "credibility_scores"

    credibility_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"))
    score = Column(Float, nullable=False)
    source_reputation_score = Column(Float, nullable=False)
    cross_source_score = Column(Float, nullable=False)
    consistency_score = Column(Float, nullable=False)
    computed_at = Column(DateTime(timezone=True), server_default=text("now()"))
    
    article = relationship("Article", back_populates="credibility")


class ArticleEntity(Base):
    __tablename__ = "article_entities"

    entity_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"))
    entity_text = Column(String(200), nullable=False)
    entity_label = Column(String(50), nullable=False)
    frequency = Column(Integer, default=1)
    start_char = Column(Integer, nullable=True)
    end_char = Column(Integer, nullable=True)
    
    article = relationship("Article", back_populates="entities")
