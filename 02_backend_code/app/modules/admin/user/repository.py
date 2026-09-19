"""User domain uses auth Login via session."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
