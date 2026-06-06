from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "NewsPulse AI"
    VERSION: str = "1.0.0"
    
    # Database
    SUPABASE_DB_URL: str
    
    # JWT Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    GEMINI_API_KEY: str
    CURRENTS_API_KEY: str | None = None

    # Email
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None
    MAIL_FROM: str | None = None
    MAIL_PORT: int = 587
    MAIL_SERVER: str | None = None
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    
    FRONTEND_URL: str = "http://localhost:3000"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost"]

    def get_gemini_keys(self) -> list[str]:
        if not self.GEMINI_API_KEY:
            return []
        # Support comma separated keys
        return [k.strip() for k in self.GEMINI_API_KEY.split(",") if k.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings() -> Settings:
    return Settings()
