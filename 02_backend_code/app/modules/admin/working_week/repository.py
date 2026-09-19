"""Working week repository."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.working_week.models import WorkingWeek


class WorkingWeekRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(
        self, week_id: int, *, include_archived: bool = True
    ) -> WorkingWeek | None:
        return await self.scalar_one_or_none(
            select(WorkingWeek).where(WorkingWeek.id == week_id)
        )

    async def get_current(self, *, as_of: date | None = None, on_date: date | None = None) -> WorkingWeek | None:
        as_of = as_of or on_date or date.today()
        stmt = (
            select(WorkingWeek)
            .where(
                WorkingWeek.effective_from <= as_of,
                (WorkingWeek.effective_to.is_(None)) | (WorkingWeek.effective_to >= as_of),
            )
            .order_by(WorkingWeek.effective_from.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_all(self, *, include_archived: bool = False) -> Sequence[WorkingWeek]:
        return await self.scalars(
            select(WorkingWeek).order_by(WorkingWeek.effective_from.desc())
        )

    async def list(self, *, include_archived: bool = False) -> Sequence[WorkingWeek]:
        return await self.list_all(include_archived=include_archived)

    async def close(self, week_id: int, effective_to: date) -> None:
        await self.execute(
            update(WorkingWeek)
            .where(WorkingWeek.id == week_id)
            .values(effective_to=effective_to)
        )
