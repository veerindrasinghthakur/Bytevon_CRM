"""Platform repository."""
from __future__ import annotations
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repositories.base_repository import BaseRepository
from app.modules.sales.models import Platform

class PlatformRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get(self, platform_id: int, *, include_archived: bool = False) -> Optional[Platform]:
        stmt = select(Platform).where(Platform.id == platform_id)
        if not include_archived:
            stmt = stmt.where(Platform.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def get_by_name(self, name: str) -> Optional[Platform]:
        return await self.scalar_one_or_none(select(Platform).where(Platform.name == name))

    async def list_all(self, *, include_archived: bool = False) -> Sequence[Platform]:
        stmt = select(Platform).order_by(Platform.name)
        if not include_archived:
            stmt = stmt.where(Platform.is_archived.is_(False))
        return await self.scalars(stmt)
