"""Application configuration management using Pydantic Settings."""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = "Malar Market Digital Ledger"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_pool_timeout: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_pool_size: int = 10

    # JWT Authentication
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]

    # Rate Limiting
    rate_limit_per_minute: int = 1000
    rate_limit_per_minute_anonymous: int = 100

    # WhatsApp API
    whatsapp_provider: str = "twilio"
    whatsapp_api_key: str = ""
    whatsapp_api_secret: str = ""
    whatsapp_phone_number: str = ""
    whatsapp_from_number: str = ""
    whatsapp_webhook_url: str = ""
    whatsapp_template_receipt: str = ""
    whatsapp_template_settlement: str = ""
    whatsapp_enabled: bool = True

    # System Settings
    default_commission_rate: float = 5.0
    market_open_time: str = "04:00:00"
    market_close_time: str = "18:00:00"

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    # File Upload
    max_upload_size: int = 10485760  # 10MB
    allowed_file_types: List[str] = ["image/jpeg", "image/png", "application/pdf"]

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @validator("allowed_file_types", pre=True)
    def parse_allowed_file_types(cls, v):
        if isinstance(v, str):
            return [file_type.strip() for file_type in v.split(",")]
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
