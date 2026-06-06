from sqlalchemy import Column, String, DateTime, text, ForeignKey, Integer, UniqueConstraint, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base

class UserBookmark(Base):
    __tablename__ = "user_bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_user_article_bookmark"),)

    bookmark_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))


class UserReadingList(Base):
    __tablename__ = "user_reading_lists"

    list_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"))


class ReadingListArticle(Base):
    __tablename__ = "reading_list_articles"
    __table_args__ = (UniqueConstraint("list_id", "article_id", name="uq_list_article"),)

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    list_id = Column(UUID(as_uuid=True), ForeignKey("user_reading_lists.list_id", ondelete="CASCADE"), nullable=False)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=text("now()"))
    position = Column(Integer, default=0)


class UserInterest(Base):
    __tablename__ = "user_interests"
    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_user_category_interest"),)

    interest_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=text("now()"))


class UserReadHistory(Base):
    __tablename__ = "user_read_history"

    history_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.article_id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime(timezone=True), server_default=text("now()"))
    read_duration_seconds = Column(Integer, default=0)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    chat_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    session_id = Column(String(100), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False) # 'USER' or 'ASSISTANT'
    message_text = Column(String(4000), nullable=False)
    cited_article_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
