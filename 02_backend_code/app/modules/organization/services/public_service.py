"""
OrganizationPublicService — only public entry point for Organization.

Owns the transaction. After successful commit, audit hooks are best-effort.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.organization.models import (
    Department,
    Holiday,
    HolidayCalendar,
    Location,
    OrganizationSettings,
    Shift,
    WorkingWeek,
)
from app.modules.organization.repositories.repository import OrganizationRepository
from app.modules.organization.schemas.schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    HolidayCalendarCreate,
    HolidayCalendarResponse,
    HolidayCalendarUpdate,
    HolidayCreate,
    HolidayResponse,
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    MessageResponse,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdate,
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
    WorkingWeekCreate,
    WorkingWeekResponse,
)
from app.modules.organization.services.admin_users_mixin import AdminUsersMixin

logger = logging.getLogger(__name__)


class OrganizationPublicService(AdminUsersMixin, BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = OrganizationRepository(session)

    # Departments, working weeks, shifts, holidays, locations, settings
    # Full implementations in module; user admin methods from AdminUsersMixin.

    async def create_department(self, data: DepartmentCreate, *, actor_employment_id: Optional[int] = None) -> DepartmentResponse:
        existing = await self._repo.get_department_by_name(data.name)
        if existing:
            raise ConflictError(f"Department '{data.name}' already exists")
        dept = Department(
            name=data.name,
            department_head_employment_id=data.department_head_employment_id,
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(dept)
        await self._commit()
        await self._audit("department.created", dept.id, actor_employment_id)
        return DepartmentResponse.model_validate(dept)

    async def get_department(self, department_id: int) -> DepartmentResponse:
        dept = await self._repo.get_department_by_id(department_id)
        if dept is None:
            raise NotFoundError("Department not found")
        return DepartmentResponse.model_validate(dept)

    async def list_departments(self, *, include_archived: bool = False) -> list[DepartmentResponse]:
        rows = await self._repo.list_departments(include_archived=include_archived)
        return [DepartmentResponse.model_validate(r) for r in rows]

    async def update_department(self, department_id: int, data: DepartmentUpdate, *, actor_employment_id: Optional[int] = None) -> DepartmentResponse:
        dept = await self._repo.get_department_by_id(department_id)
        if dept is None:
            raise NotFoundError("Department not found")
        if data.name is not None and data.name != dept.name:
            clash = await self._repo.get_department_by_name(data.name)
            if clash and clash.id != department_id:
                raise ConflictError(f"Department '{data.name}' already exists")
            dept.name = data.name
        if data.department_head_employment_id is not None:
            dept.department_head_employment_id = data.department_head_employment_id
        await self._commit()
        await self._audit("department.updated", dept.id, actor_employment_id)
        return DepartmentResponse.model_validate(dept)

    async def archive_department(self, department_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        dept = await self._repo.get_department_by_id(department_id)
        if dept is None:
            raise NotFoundError("Department not found")
        if dept.is_archived:
            raise DomainError("Department is already archived")
        now = datetime.now(timezone.utc)
        dept.is_archived = True
        dept.archived_at = now
        dept.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("department.archived", dept.id, actor_employment_id)
        return MessageResponse(message="Department archived")

    async def create_working_week(self, data: WorkingWeekCreate, *, actor_employment_id: Optional[int] = None) -> WorkingWeekResponse:
        current = await self._repo.get_current_working_week(as_of=data.effective_from)
        if current and getattr(current, "effective_to", None) is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_working_week(current.id, close_to)
        week = WorkingWeek(
            **{k: v for k, v in data.model_dump().items() if hasattr(WorkingWeek, k)},
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        ) if False else None
        # Prefer explicit fields depending on model shape
        payload = data.model_dump()
        week = WorkingWeek(
            **payload,
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        ) if "name" in payload else WorkingWeek(
            effective_from=data.effective_from,
            monday=getattr(data, "monday", True),
            tuesday=getattr(data, "tuesday", True),
            wednesday=getattr(data, "wednesday", True),
            thursday=getattr(data, "thursday", True),
            friday=getattr(data, "friday", True),
            saturday=getattr(data, "saturday", False),
            sunday=getattr(data, "sunday", False),
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        try:
            await self._repo.add(week)
        except Exception:
            # fallback for model with name + working_days_of_week
            week = WorkingWeek(
                name=getattr(data, "name", "Default"),
                working_days_of_week=getattr(data, "working_days_of_week", [1, 2, 3, 4, 5]),
                effective_from=data.effective_from,
                effective_to=None,
                created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
            )
            await self._repo.add(week)
        await self._commit()
        await self._audit("working_week.created", week.id, actor_employment_id)
        return WorkingWeekResponse.model_validate(week)

    async def get_working_week(self, week_id: int) -> WorkingWeekResponse:
        week = await self._repo.get_working_week_by_id(week_id)
        if week is None:
            raise NotFoundError("Working week not found")
        return WorkingWeekResponse.model_validate(week)

    async def get_current_working_week(self, *, as_of: Optional[date] = None) -> WorkingWeekResponse:
        week = await self._repo.get_current_working_week(as_of=as_of)
        if week is None:
            raise NotFoundError("No effective working week found")
        return WorkingWeekResponse.model_validate(week)

    async def list_working_weeks(self) -> list[WorkingWeekResponse]:
        rows = await self._repo.list_working_weeks()
        return [WorkingWeekResponse.model_validate(r) for r in rows]

    async def create_shift(self, data: ShiftCreate, *, actor_employment_id: Optional[int] = None) -> ShiftResponse:
        payload = data.model_dump()
        payload["changed_by"] = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        shift = Shift(**{k: v for k, v in payload.items() if k in Shift.__table__.columns.keys() or True})
        # Safer construct
        shift = Shift(
            name=data.name,
            start_time=data.start_time,
            end_time=data.end_time,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        for attr in ("is_overnight", "grace_late_minutes", "grace_in_minutes", "grace_out_minutes",
                     "flexible_end", "break_duration_minutes", "break_minutes"):
            if hasattr(data, attr) and hasattr(shift, attr):
                setattr(shift, attr, getattr(data, attr))
        await self._repo.add(shift)
        await self._commit()
        await self._audit("shift.created", shift.id, actor_employment_id)
        return ShiftResponse.model_validate(shift)

    async def get_shift(self, shift_id: int) -> ShiftResponse:
        shift = await self._repo.get_shift_by_id(shift_id)
        if shift is None:
            raise NotFoundError("Shift not found")
        return ShiftResponse.model_validate(shift)

    async def list_shifts(self, *, include_archived: bool = False) -> list[ShiftResponse]:
        rows = await self._repo.list_shifts(include_archived=include_archived)
        return [ShiftResponse.model_validate(r) for r in rows]

    async def update_shift(self, shift_id: int, data: ShiftUpdate, *, actor_employment_id: Optional[int] = None) -> ShiftResponse:
        shift = await self._repo.get_shift_by_id(shift_id)
        if shift is None:
            raise NotFoundError("Shift not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            if hasattr(shift, field):
                setattr(shift, field, value)
        if hasattr(shift, "changed_by"):
            shift.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.updated", shift.id, actor_employment_id)
        return ShiftResponse.model_validate(shift)

    async def archive_shift(self, shift_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        shift = await self._repo.get_shift_by_id(shift_id)
        if shift is None:
            raise NotFoundError("Shift not found")
        if shift.is_archived:
            raise DomainError("Shift is already archived")
        now = datetime.now(timezone.utc)
        shift.is_archived = True
        shift.archived_at = now
        shift.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        if hasattr(shift, "changed_by"):
            shift.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.archived", shift.id, actor_employment_id)
        return MessageResponse(message="Shift archived")

    async def create_holiday_calendar(self, data: HolidayCalendarCreate, *, actor_employment_id: Optional[int] = None) -> HolidayCalendarResponse:
        cal = HolidayCalendar(
            name=data.name,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        if hasattr(data, "year") and hasattr(cal, "year"):
            cal.year = data.year
        await self._repo.add(cal)
        await self._commit()
        await self._audit("holiday_calendar.created", cal.id, actor_employment_id)
        return HolidayCalendarResponse.model_validate(cal)

    async def get_holiday_calendar(self, calendar_id: int) -> HolidayCalendarResponse:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        return HolidayCalendarResponse.model_validate(cal)

    async def list_holiday_calendars(self, *, include_archived: bool = False) -> list[HolidayCalendarResponse]:
        rows = await self._repo.list_holiday_calendars(include_archived=include_archived)
        return [HolidayCalendarResponse.model_validate(r) for r in rows]

    async def update_holiday_calendar(self, calendar_id: int, data: HolidayCalendarUpdate, *, actor_employment_id: Optional[int] = None) -> HolidayCalendarResponse:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        if data.name is not None:
            cal.name = data.name
        cal.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("holiday_calendar.updated", cal.id, actor_employment_id)
        return HolidayCalendarResponse.model_validate(cal)

    async def archive_holiday_calendar(self, calendar_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        if cal.is_archived:
            raise DomainError("Holiday calendar is already archived")
        now = datetime.now(timezone.utc)
        cal.is_archived = True
        cal.archived_at = now
        cal.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        cal.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("holiday_calendar.archived", cal.id, actor_employment_id)
        return MessageResponse(message="Holiday calendar archived")

    async def add_holiday(self, data: HolidayCreate, *, actor_employment_id: Optional[int] = None) -> HolidayResponse:
        cal = await self._repo.get_holiday_calendar_by_id(data.holiday_calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        holiday = Holiday(
            holiday_calendar_id=data.holiday_calendar_id,
            name=data.name,
            holiday_type=data.holiday_type,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        if hasattr(data, "holiday_date") and hasattr(holiday, "holiday_date"):
            holiday.holiday_date = data.holiday_date
        if hasattr(data, "date") and hasattr(holiday, "date"):
            holiday.date = data.date
        if hasattr(data, "recurring_flag") and hasattr(holiday, "recurring_flag"):
            holiday.recurring_flag = data.recurring_flag
        await self._repo.add(holiday)
        await self._commit()
        await self._audit("holiday.created", holiday.id, actor_employment_id)
        return HolidayResponse.model_validate(holiday)

    async def list_holidays(self, calendar_id: int) -> list[HolidayResponse]:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        rows = await self._repo.list_holidays_for_calendar(calendar_id)
        return [HolidayResponse.model_validate(r) for r in rows]

    async def create_location(self, data: LocationCreate, *, actor_employment_id: Optional[int] = None) -> LocationResponse:
        payload = data.model_dump()
        payload["changed_by"] = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        loc = Location(**payload)
        await self._repo.add(loc)
        await self._commit()
        await self._audit("location.created", loc.id, actor_employment_id)
        return LocationResponse.model_validate(loc)

    async def get_location(self, location_id: int) -> LocationResponse:
        loc = await self._repo.get_location_by_id(location_id)
        if loc is None:
            raise NotFoundError("Location not found")
        return LocationResponse.model_validate(loc)

    async def list_locations(self, *, include_archived: bool = False) -> list[LocationResponse]:
        rows = await self._repo.list_locations(include_archived=include_archived)
        return [LocationResponse.model_validate(r) for r in rows]

    async def update_location(self, location_id: int, data: LocationUpdate, *, actor_employment_id: Optional[int] = None) -> LocationResponse:
        loc = await self._repo.get_location_by_id(location_id)
        if loc is None:
            raise NotFoundError("Location not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(loc, field, value)
        loc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.updated", loc.id, actor_employment_id)
        return LocationResponse.model_validate(loc)

    async def archive_location(self, location_id: int, *, actor_employment_id: Optional[int] = None) -> MessageResponse:
        loc = await self._repo.get_location_by_id(location_id)
        if loc is None:
            raise NotFoundError("Location not found")
        if loc.is_archived:
            raise DomainError("Location is already archived")
        now = datetime.now(timezone.utc)
        loc.is_archived = True
        loc.archived_at = now
        loc.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        loc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.archived", loc.id, actor_employment_id)
        return MessageResponse(message="Location archived")

    async def get_organization_settings(self) -> OrganizationSettingsResponse:
        settings_row = await self._repo.get_organization_settings()
        if settings_row is None:
            raise NotFoundError("Organization settings not configured")
        return OrganizationSettingsResponse.model_validate(settings_row)

    async def upsert_organization_settings(self, data: OrganizationSettingsUpdate, *, actor_employment_id: Optional[int] = None) -> OrganizationSettingsResponse:
        row = await self._repo.get_organization_settings()
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        if row is None:
            if not data.company_name or not data.default_timezone or not data.default_currency:
                raise DomainError(
                    "company_name, default_timezone and default_currency are required when creating organization settings"
                )
            row = OrganizationSettings(
                company_name=data.company_name,
                head_office_location_id=data.head_office_location_id,
                default_timezone=data.default_timezone,
                default_currency=data.default_currency,
                logo_reference=data.logo_reference,
                changed_by=actor,
            )
            await self._repo.add(row)
        else:
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(row, field, value)
            row.changed_by = actor
        await self._commit()
        await self._audit("organization_settings.upserted", row.id, actor_employment_id)
        return OrganizationSettingsResponse.model_validate(row)
