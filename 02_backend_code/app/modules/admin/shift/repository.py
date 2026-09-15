"""Shift repository."""
from __future__ import annotations
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.shift.models import Shift

class ShiftRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(self, shift_id: int, *, include_archived: bool = False) -> Optional[Shift]:
        stmt = select(Shift).where(Shift.id == shift_id)
        if not include_archived:
            stmt = stmt.where(Shift.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_all(self, *, include_archived: bool = False) -> Sequence[Shift]:
        stmt = select(Shift).order_by(Shift.name)
        if not include_archived:
            stmt = stmt.where(Shift.is_archived.is_(False))
        return await self.scalars(stmt)
