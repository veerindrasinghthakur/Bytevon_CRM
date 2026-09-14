"""Holiday calendar / holiday repository."""
from __future__ import annotations
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.holiday_calendar.models import Holiday, HolidayCalendar

class HolidayCalendarRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_calendar_by_id(self, calendar_id: int, *, include_archived: bool = False) -> Optional[HolidayCalendar]:
        stmt = select(HolidayCalendar).where(HolidayCalendar.id == calendar_id)
        if not include_archived:
            stmt = stmt.where(HolidayCalendar.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_calendars(self, *, include_archived: bool = False) -> Sequence[HolidayCalendar]:
        stmt = select(HolidayCalendar).order_by(HolidayCalendar.name)
        if not include_archived:
            stmt = stmt.where(HolidayCalendar.is_archived.is_(False))
        return await self.scalars(stmt)

    async def get_holiday_by_id(self, holiday_id: int) -> Optional[Holiday]:
        return await self.scalar_one_or_none(select(Holiday).where(Holiday.id == holiday_id))

    async def list_holidays_for_calendar(self, calendar_id: int) -> Sequence[Holiday]:
        stmt = select(Holiday).where(Holiday.holiday_calendar_id == calendar_id).order_by(Holiday.date)
        return await self.scalars(stmt)
