"""
Async SQLAlchemy engine, session factory, and dependency helpers.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
    # Configurable via DB_POOL_SIZE / DB_MAX_OVERFLOW env vars.
    # Defaults are conservative for Neon free tier (max 25 connections total).
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    connect_args={"statement_cache_size": 0},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an AsyncSession.
    Does NOT commit or rollback — Public Services own the transaction boundary.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
