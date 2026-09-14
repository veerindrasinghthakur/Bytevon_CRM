"""
OrganizationPublicService — compatibility facade over admin domain services.

Prefer domain services under app.modules.admin.* for new code.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.department.schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    MessageResponse,
)
from app.modules.admin.department.service import DepartmentService
from app.modules.admin.holiday_calendar.schemas import (
    HolidayCalendarCreate,
    HolidayCalendarResponse,
    HolidayCalendarUpdate,
    HolidayCreate,
    HolidayResponse,
    HolidayUpdate,
)
from app.modules.admin.holiday_calendar.service import HolidayCalendarService
from app.modules.admin.location.schemas import LocationCreate, LocationResponse, LocationUpdate
from app.modules.admin.location.service import LocationService
from app.modules.admin.settings.schemas import OrganizationSettingsResponse, OrganizationSettingsUpdate
from app.modules.admin.settings.service import SettingsService
from app.modules.admin.shift.schemas import ShiftCreate, ShiftResponse, ShiftUpdate
from app.modules.admin.shift.service import ShiftService
from app.modules.admin.working_week.schemas import WorkingWeekCreate, WorkingWeekResponse
from app.modules.admin.working_week.service import WorkingWeekService


class OrganizationPublicService:
    """Delegates to admin domain services (same session / TX ownership per call)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._departments = DepartmentService(session)
        self._locations = LocationService(session)
        self._shifts = ShiftService(session)
        self._weeks = WorkingWeekService(session)
        self._holidays = HolidayCalendarService(session)
        self._settings = SettingsService(session)

    # Departments
    async def create_department(self, data: DepartmentCreate, *, actor_employment_id: Optional[int] = None) -> DepartmentResponse:
        return await self._departments.create(data, actor_employment_id=actor_employment_id)

    async def get_department(self, department_id: int) -> DepartmentResponse:
        return await self._departments.get(department_id)

    async def list_departments(self, *, include_archived: bool = False) -> list[DepartmentResponse]:
        return await self._departments.list(include_archived=include_archived)

    async def update_department(self, department_id: int, data: DepartmentUpdate, *, actor_employment_id: Optional[int] = None) -> DepartmentResponse:
        return await self._departments.update(department_id, data, actor_employment_id=actor_employment_id)

    async def archive_department(self, department_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        return await self._departments.archive(department_id, actor_employment_id=actor_employment_id)

    # Locations
    async def create_location(self, data: LocationCreate, *, actor_employment_id: Optional[int] = None) -> LocationResponse:
        return await self._locations.create(data, actor_employment_id=actor_employment_id)

    async def get_location(self, location_id: int) -> LocationResponse:
        return await self._locations.get(location_id)

    async def list_locations(self, *, include_archived: bool = False) -> list[LocationResponse]:
        return await self._locations.list(include_archived=include_archived)

    async def update_location(self, location_id: int, data: LocationUpdate, *, actor_employment_id: Optional[int] = None) -> LocationResponse:
        return await self._locations.update(location_id, data, actor_employment_id=actor_employment_id)

    async def archive_location(self, location_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        return await self._locations.archive(location_id, actor_employment_id=actor_employment_id)

    # Shifts
    async def create_shift(self, data: ShiftCreate, *, actor_employment_id: Optional[int] = None) -> ShiftResponse:
        return await self._shifts.create(data, actor_employment_id=actor_employment_id)

    async def get_shift(self, shift_id: int) -> ShiftResponse:
        return await self._shifts.get(shift_id)

    async def list_shifts(self, *, include_archived: bool = False) -> list[ShiftResponse]:
        return await self._shifts.list(include_archived=include_archived)

    async def update_shift(self, shift_id: int, data: ShiftUpdate, *, actor_employment_id: Optional[int] = None) -> ShiftResponse:
        return await self._shifts.update(shift_id, data, actor_employment_id=actor_employment_id)

    async def archive_shift(self, shift_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        return await self._shifts.archive(shift_id, actor_employment_id=actor_employment_id)

    # Working weeks
    async def create_working_week(self, data: WorkingWeekCreate, *, actor_employment_id: Optional[int] = None) -> WorkingWeekResponse:
        return await self._weeks.create(data, actor_employment_id=actor_employment_id)

    async def get_working_week(self, week_id: int) -> WorkingWeekResponse:
        return await self._weeks.get(week_id)

    async def get_current_working_week(self) -> WorkingWeekResponse:
        return await self._weeks.get_current()

    async def list_working_weeks(self, *, include_archived: bool = False) -> list[WorkingWeekResponse]:
        return await self._weeks.list(include_archived=include_archived)

    async def archive_working_week(self, week_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        return await self._weeks.archive(week_id, actor_employment_id=actor_employment_id)

    # Holiday calendars
    async def create_holiday_calendar(self, data: HolidayCalendarCreate, *, actor_employment_id: Optional[int] = None) -> HolidayCalendarResponse:
        return await self._holidays.create(data, actor_employment_id=actor_employment_id)

    async def get_holiday_calendar(self, calendar_id: int) -> HolidayCalendarResponse:
        return await self._holidays.get(calendar_id)

    async def list_holiday_calendars(self, *, include_archived: bool = False) -> list[HolidayCalendarResponse]:
        return await self._holidays.list(include_archived=include_archived)

    async def update_holiday_calendar(self, calendar_id: int, data: HolidayCalendarUpdate, *, actor_employment_id: Optional[int] = None) -> HolidayCalendarResponse:
        return await self._holidays.update(calendar_id, data, actor_employment_id=actor_employment_id)

    async def archive_holiday_calendar(self, calendar_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        return await self._holidays.archive(calendar_id, actor_employment_id=actor_employment_id)

    async def add_holiday(self, calendar_id: int, data: HolidayCreate, *, actor_employment_id: Optional[int] = None) -> HolidayResponse:
        return await self._holidays.add_holiday(calendar_id, data, actor_employment_id=actor_employment_id)

    async def list_holidays(self, calendar_id: int) -> list[HolidayResponse]:
        return await self._holidays.list_holidays(calendar_id)

    async def get_holiday(self, holiday_id: int) -> HolidayResponse:
        return await self._holidays.get_holiday(holiday_id)

    async def update_holiday(self, holiday_id: int, data: HolidayUpdate, *, actor_employment_id: Optional[int] = None) -> HolidayResponse:
        return await self._holidays.update_holiday(holiday_id, data, actor_employment_id=actor_employment_id)

    async def delete_holiday(self, holiday_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        return await self._holidays.delete_holiday(holiday_id, actor_employment_id=actor_employment_id)

    # Settings
    async def get_organization_settings(self) -> OrganizationSettingsResponse:
        return await self._settings.get()

    async def upsert_organization_settings(self, data: OrganizationSettingsUpdate, *, actor_employment_id: Optional[int] = None) -> OrganizationSettingsResponse:
        return await self._settings.upsert(data, actor_employment_id=actor_employment_id)
