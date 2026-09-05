"""
OrganizationRepository — domain-specific queries only.
"""

from __future__ import annotations

from datetime import date
from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.organization.models import (
    Department,
    Holiday,
    HolidayCalendar,
    Location,
    OrganizationSettings,
    Shift,
    WorkingWeek,
)


class OrganizationRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Department
    # ------------------------------------------------------------------

    async def get_department_by_id(
        self, department_id: int, *, include_archived: bool = False
    ) -> Optional[Department]:
        stmt = select(Department).where(Department.id == department_id)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_departments(
        self, *, include_archived: bool = False
    ) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name)
        if not include_archived:
            stmt = stmt.where(Department.is_archived.is_(False))
        return await self.scalars(stmt)

    async def get_department_by_name(self, name: str) -> Optional[Department]:
        stmt = select(Department).where(
            Department.name == name, Department.is_archived.is_(False)
        )
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # WorkingWeek
    # ------------------------------------------------------------------

    async def get_working_week_by_id(self, week_id: int) -> Optional[WorkingWeek]:
        stmt = select(WorkingWeek).where(WorkingWeek.id == week_id)
        return await self.scalar_one_or_none(stmt)

    async def get_current_working_week(
        self, *, as_of: Optional[date] = None
    ) -> Optional[WorkingWeek]:
        """Return the version effective on as_of (default today)."""
        as_of = as_of or date.today()
        stmt = (
            select(WorkingWeek)
            .where(
                WorkingWeek.effective_from <= as_of,
                (WorkingWeek.effective_to.is_(None))
                | (WorkingWeek.effective_to >= as_of),
            )
            .order_by(WorkingWeek.effective_from.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_working_weeks(self) -> Sequence[WorkingWeek]:
        stmt = select(WorkingWeek).order_by(WorkingWeek.effective_from.desc())
        return await self.scalars(stmt)

    async def close_working_week(
        self, week_id: int, effective_to: date
    ) -> None:
        stmt = (
            update(WorkingWeek)
            .where(WorkingWeek.id == week_id)
            .values(effective_to=effective_to)
        )
        await self.execute(stmt)

    # ------------------------------------------------------------------
    # Shift
    # ------------------------------------------------------------------

    async def get_shift_by_id(
        self, shift_id: int, *, include_archived: bool = False
    ) -> Optional[Shift]:
        stmt = select(Shift).where(Shift.id == shift_id)
        if not include_archived:
            stmt = stmt.where(Shift.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_shifts(
        self, *, include_archived: bool = False
    ) -> Sequence[Shift]:
        stmt = select(Shift).order_by(Shift.name)
        if not include_archived:
            stmt = stmt.where(Shift.is_archived.is_(False))
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # HolidayCalendar
    # ------------------------------------------------------------------

    async def get_holiday_calendar_by_id(
        self, calendar_id: int, *, include_archived: bool = False
    ) -> Optional[HolidayCalendar]:
        stmt = select(HolidayCalendar).where(HolidayCalendar.id == calendar_id)
        if not include_archived:
            stmt = stmt.where(HolidayCalendar.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_holiday_calendars(
        self, *, include_archived: bool = False
    ) -> Sequence[HolidayCalendar]:
        stmt = select(HolidayCalendar).order_by(HolidayCalendar.name)
        if not include_archived:
            stmt = stmt.where(HolidayCalendar.is_archived.is_(False))
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # Holiday
    # ------------------------------------------------------------------

    async def get_holiday_by_id(self, holiday_id: int) -> Optional[Holiday]:
        stmt = select(Holiday).where(Holiday.id == holiday_id)
        return await self.scalar_one_or_none(stmt)

    async def list_holidays_for_calendar(
        self, calendar_id: int
    ) -> Sequence[Holiday]:
        stmt = (
            select(Holiday)
            .where(Holiday.holiday_calendar_id == calendar_id)
            .order_by(Holiday.date)
        )
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # Location
    # ------------------------------------------------------------------

    async def get_location_by_id(
        self, location_id: int, *, include_archived: bool = False
    ) -> Optional[Location]:
        stmt = select(Location).where(Location.id == location_id)
        if not include_archived:
            stmt = stmt.where(Location.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_locations(
        self, *, include_archived: bool = False
    ) -> Sequence[Location]:
        stmt = select(Location).order_by(Location.name)
        if not include_archived:
            stmt = stmt.where(Location.is_archived.is_(False))
        return await self.scalars(stmt)

    # ------------------------------------------------------------------
    # OrganizationSettings (singleton)
    # ------------------------------------------------------------------

    async def get_organization_settings(self) -> Optional[OrganizationSettings]:
        stmt = select(OrganizationSettings).limit(1)
        return await self.scalar_one_or_none(stmt)
