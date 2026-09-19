"""Position repository (admin domain; table owned by workforce model)."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.workforce.models import Position


class PositionRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(self, position_id: int, *, include_archived: bool = False) -> Position | None:
        stmt = select(Position).where(Position.id == position_id)
        if not include_archived:
            stmt = stmt.where(Position.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def get_by_name(self, name: str) -> Position | None:
        return await self.scalar_one_or_none(select(Position).where(Position.name == name))

    async def list_all(self, *, include_archived: bool = False) -> Sequence[Position]:
        stmt = select(Position).order_by(Position.name)
        if not include_archived:
            stmt = stmt.where(Position.is_archived.is_(False))
        return await self.scalars(stmt)
