"""
Application settings (Pydantic v2).

Loaded from environment variables / .env file.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "ByteVon CRM"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = Field(
        ...,
        description="Async PostgreSQL URL, e.g. postgresql+asyncpg://user:pass@host:5432/db",
    )
    DATABASE_ECHO: bool = False

    # JWT / Auth V1
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Password reset
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 10

    # Account lockout
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 20

    # System actor (reserved employment id)
    SYSTEM_EMPLOYMENT_ID: int = 1

    # CORS - allow frontend dev server origins
    # Added localhost ports 5173 and 5174 for Vite dev server.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:18000/"

    # Logging
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> str:
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
