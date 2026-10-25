"""
Application settings (Pydantic v2).

Loaded from environment variables / .env file.
"""

from __future__ import annotations

from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

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

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: object) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            v_lower = v.strip().lower()
            if v_lower in ("1", "true", "t", "yes", "y", "debug"):
                return True
            if v_lower in ("0", "false", "f", "no", "n", "release", ""):
                return False
        return bool(v)

    # Database
    DATABASE_URL: str = Field(
        ...,
        description="Async PostgreSQL URL, e.g. postgresql+asyncpg://user:pass@host:5432/db?ssl=require",
    )
    DATABASE_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: object) -> str:
        if not isinstance(v, str):
            return str(v)
        v = v.strip()
        parts = urlsplit(v)
        scheme = parts.scheme
        # Ensure asyncpg dialect prefix for PostgreSQL
        if scheme in ("postgres", "postgresql"):
            scheme = "postgresql+asyncpg"
        # Parse query params, map sslmode -> ssl for asyncpg, drop unsupported params
        query_params = parse_qsl(parts.query, keep_blank_values=True)
        new_params: list[tuple[str, str]] = []
        for k, val in query_params:
            if k == "sslmode":
                new_params.append(("ssl", val))
            elif k in ("channel_binding",):
                continue
            else:
                new_params.append((k, val))
        new_query = urlencode(new_params)
        return urlunsplit((scheme, parts.netloc, parts.path, new_query, parts.fragment))

    # Connection pool — keep small for Neon free tier (max 25 pooled connections).
    # Direct (non-pooled) Neon connections are used for Alembic migrations only.
    DB_POOL_SIZE: int = Field(
        default=3,
        description="SQLAlchemy pool_size; keep ≤5 for Neon free tier.",
    )
    DB_MAX_OVERFLOW: int = Field(
        default=5,
        description="SQLAlchemy max_overflow on top of pool_size.",
    )

    # JWT / Auth V1 — names match .env / .env.example contract.
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TTL_MINUTES: int = 30
    JWT_REFRESH_TTL_DAYS: int = 30

    # Password reset
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 10

    # Account lockout
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 20

    # System actor (reserved employment id)
    SYSTEM_EMPLOYMENT_ID: int = 1

    # CORS - allow frontend dev server origins
    # Added localhost ports 5173 and 5174 for Vite dev server.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:18000"

    # Logging
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> str:
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    # Object storage (MinIO / S3-compatible)
    # Set STORAGE_ENABLED=false (the default) on Render — no MinIO is available.
    # Set STORAGE_ENABLED=true in local Docker Compose (.env already does this
    # via MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY).
    STORAGE_ENABLED: bool = Field(
        default=False,
        description="Master switch for MinIO/S3 object storage. False = deferred (prototype).",
    )
    MINIO_ENDPOINT: str = Field(
        default="minio:9000",
        description="MinIO endpoint host:port",
    )
    MINIO_ACCESS_KEY: str = Field(
        default="minioadmin",
        description="MinIO access key",
    )
    MINIO_SECRET_KEY: str = Field(
        default="minioadmin",
        description="MinIO secret key",
    )
    MINIO_SECURE: bool = Field(
        default=False,
        description="Use HTTPS for MinIO connection",
    )

    # Email (SMTP) — Gmail defaults; credentials live in .env (never committed).
    # Gmail requires an App Password (Google Account → Security → 2-Step
    # Verification → App passwords), NOT the regular account password.
    EMAIL_ENABLED: bool = Field(
        default=False,
        description="Master kill-switch for outbound email. When false, sends are skipped (logged).",
    )
    SMTP_HOST: str = Field(
        default="smtp.gmail.com",
        description="SMTP hostname (Gmail: smtp.gmail.com)",
    )
    SMTP_PORT: int = Field(
        default=587,
        description="SMTP port (Gmail: 587 with STARTTLS)",
    )
    SMTP_USE_TLS: bool = Field(
        default=True,
        description="Use STARTTLS on connect (Gmail: true)",
    )
    SMTP_USERNAME: str = Field(
        default="",
        description="SMTP username (Gmail: full address, e.g. you@gmail.com)",
    )
    SMTP_PASSWORD: str = Field(
        default="",
        description="SMTP password (Gmail: 16-char App Password, no spaces)",
    )
    SMTP_FROM_EMAIL: str = Field(
        default="",
        description="Default From address (Gmail: usually same as SMTP_USERNAME)",
    )
    SMTP_FROM_NAME: str = Field(
        default="ByteVon CRM",
        description="Default From display name",
    )
    SMTP_TIMEOUT_SECONDS: int = Field(
        default=15,
        description="SMTP connect/send timeout",
    )

    # Frontend base URL used to build links inside emails (e.g. password reset).
    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        description="Public frontend base URL for email links",
    )


@lru_cache
def get_settings() -> Settings:
    # Required fields are supplied at runtime via .env/environment (pydantic-settings);
    # the static checker cannot observe that source.
    return Settings()  # pyright: ignore[reportCallIssue]


settings = get_settings()
