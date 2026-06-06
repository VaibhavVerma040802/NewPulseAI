from sqlalchemy import Column, String, Boolean, SmallInteger, DateTime, Enum, text
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base
import enum

class RoleEnum(str, enum.Enum):
    GUEST = "GUEST"
    USER = "USER"
    ADMIN = "ADMIN"

class StatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    LOCKED = "LOCKED"
    DISABLED = "DISABLED"
    DELETED = "DELETED"

class OAuthProviderEnum(str, enum.Enum):
    NONE = "NONE"
    GOOGLE = "GOOGLE"
    GITHUB = "GITHUB"

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    full_name = Column(String(100), nullable=False)
    email = Column(String(254), nullable=False, unique=True, index=True)
    password_hash = Column(String(60), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.USER)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.PENDING)
    email_verified = Column(Boolean, nullable=False, default=False)
    oauth_provider = Column(Enum(OAuthProviderEnum), default=OAuthProviderEnum.NONE)
    oauth_provider_id = Column(String(200), nullable=True)
    profile_image_url = Column(String(2000), nullable=True)
    timezone = Column(String(50), default="UTC")
    failed_login_attempts = Column(SmallInteger, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
