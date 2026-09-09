"""
OrganizationPublicService — only public entry point for Organization.

Owns the transaction. After successful commit, audit hooks are best-effort.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

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
from app.modules.organization.services.department_members import DepartmentMembersMixin

logger = logging.getLogger(__name__)


def _optional_id(value: Optional[int]) -> Optional[int]:
    if value is None or value <= 0:
        return None
    return value


class OrganizationPublicService(AdminUsersMixin, DepartmentMembersMixin, BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = OrganizationRepository(session)

    async def _refresh(self, obj: Any) -> Any:
        await self._session.refresh(obj)
        return obj

    # ==================================================================
    # Departments
    # ==================================================================

    async def create_department(
        self, data: DepartmentCreate, *, actor_employment_id: Optional[int] = None
    ) -> DepartmentResponse:
        existing = await self._repo.get_department_by_name(data.name)
        if existing:
            raise ConflictError(f"Department '{data.name}' already exists")
        head_id = _optional_id(data.department_head_employment_id)
        dept = Department(
            name=data.name.strip(),
            department_head_employment_id=head_id,
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(dept)
        await self._commit()
        await self._audit("department.created", dept.id, actor_employment_id)
        await self._refresh(dept)
        return DepartmentResponse.model_validate(dept)

    async def get_department(self, department_id: int) -> DepartmentResponse:
        dept = await self._repo.get_department_by_id(department_id)
        if dept is None:
            raise NotFoundError("Department not found")
        return DepartmentResponse.model_validate(dept)

    async def list_departments(
        self, *, include_archived: bool = False
    ) -> list[DepartmentResponse]:
        rows = await self._repo.list_departments(include_archived=include_archived)
        return [DepartmentResponse.model_validate(r) for r in rows]

    async def update_department(
        self,
        department_id: int,
        data: DepartmentUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DepartmentResponse:
        dept = await self._repo.get_department_by_id(department_id)
        if dept is None:
            raise NotFoundError("Department not found")
        if data.name is not None and data.name != dept.name:
            clash = await self._repo.get_department_by_name(data.name)
            if clash and clash.id != department_id:
                raise ConflictError(f"Department '{data.name}' already exists")
            dept.name = data.name.strip()
        if "department_head_employment_id" in data.model_dump(exclude_unset=True):
            dept.department_head_employment_id = _optional_id(
                data.department_head_employment_id
            )
        await self._commit()
        await self._audit("department.updated", dept.id, actor_employment_id)
        await self._refresh(dept)
        return DepartmentResponse.model_validate(dept)

    async def archive_department(
        self, department_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
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

    # ==================================================================
    # Working weeks (versioned — close previous on create / archive)
    # ==================================================================

    async def create_working_week(
        self, data: WorkingWeekCreate, *, actor_employment_id: Optional[int] = None
    ) -> WorkingWeekResponse:
        if not data.working_days_of_week:
            raise DomainError("working_days_of_week must include at least one day")
        for d in data.working_days_of_week:
            if d < 0 or d > 6:
                raise DomainError(
                    "working_days_of_week values must be 0–6 (0=Mon … 6=Sun)"
                )

        current = await self._repo.get_current_working_week(as_of=data.effective_from)
        if current is not None and current.effective_to is None:
            close_to = data.effective_from - timedelta(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_working_week(current.id, close_to)
            else:
                # Same-day supersede: close previous on the same day
                await self._repo.close_working_week(current.id, data.effective_from)

        week = WorkingWeek(
            name=data.name.strip(),
            working_days_of_week=list(data.working_days_of_week),
            effective_from=data.effective_from,
            effective_to=None,
            created_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(week)
        await self._commit()
        await self._audit("working_week.created", week.id, actor_employment_id)
        await self._refresh(week)
        return WorkingWeekResponse.model_validate(week)

    async def get_working_week(self, week_id: int) -> WorkingWeekResponse:
        week = await self._repo.get_working_week_by_id(week_id)
        if week is None:
            raise NotFoundError("Working week not found")
        return WorkingWeekResponse.model_validate(week)

    async def get_current_working_week(
        self, *, as_of: Optional[date] = None
    ) -> WorkingWeekResponse:
        week = await self._repo.get_current_working_week(as_of=as_of)
        if week is None:
            raise NotFoundError(
                "No effective working week found — create one via POST /organization/working-weeks"
            )
        return WorkingWeekResponse.model_validate(week)

    async def list_working_weeks(self) -> list[WorkingWeekResponse]:
        rows = await self._repo.list_working_weeks()
        return [WorkingWeekResponse.model_validate(r) for r in rows]

    async def archive_working_week(
        self,
        week_id: int,
        *,
        actor_employment_id: Optional[int] = None,
        effective_to: Optional[date] = None,
    ) -> MessageResponse:
        """Close a versioned working week (set effective_to). Not a soft-delete row."""
        week = await self._repo.get_working_week_by_id(week_id)
        if week is None:
            raise NotFoundError("Working week not found")
        if week.effective_to is not None:
            raise DomainError("Working week is already closed")

        close_on = effective_to or date.today()
        if close_on < week.effective_from:
            raise DomainError(
                f"effective_to ({close_on}) cannot be before effective_from ({week.effective_from})"
            )
        await self._repo.close_working_week(week.id, close_on)
        await self._commit()
        await self._audit("working_week.archived", week.id, actor_employment_id)
        return MessageResponse(
            message=f"Working week closed (effective_to={close_on.isoformat()})"
        )

    # ==================================================================
    # Shifts
    # ==================================================================

    async def create_shift(
        self, data: ShiftCreate, *, actor_employment_id: Optional[int] = None
    ) -> ShiftResponse:
        shift = Shift(
            name=data.name.strip(),
            start_time=data.start_time,
            end_time=data.end_time,
            is_overnight=data.is_overnight,
            grace_late_minutes=data.grace_late_minutes,
            flexible_end=data.flexible_end,
            break_duration_minutes=data.break_duration_minutes,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(shift)
        await self._commit()
        await self._audit("shift.created", shift.id, actor_employment_id)
        await self._refresh(shift)
        return ShiftResponse.model_validate(shift)

    async def get_shift(self, shift_id: int) -> ShiftResponse:
        shift = await self._repo.get_shift_by_id(shift_id)
        if shift is None:
            raise NotFoundError("Shift not found")
        return ShiftResponse.model_validate(shift)

    async def list_shifts(
        self, *, include_archived: bool = False
    ) -> list[ShiftResponse]:
        rows = await self._repo.list_shifts(include_archived=include_archived)
        return [ShiftResponse.model_validate(r) for r in rows]

    async def update_shift(
        self,
        shift_id: int,
        data: ShiftUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> ShiftResponse:
        shift = await self._repo.get_shift_by_id(shift_id)
        if shift is None:
            raise NotFoundError("Shift not found")
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and isinstance(payload["name"], str):
            payload["name"] = payload["name"].strip()
        for field, value in payload.items():
            if hasattr(shift, field):
                setattr(shift, field, value)
        shift.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.updated", shift.id, actor_employment_id)
        await self._refresh(shift)
        return ShiftResponse.model_validate(shift)

    async def archive_shift(
        self, shift_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        shift = await self._repo.get_shift_by_id(shift_id)
        if shift is None:
            raise NotFoundError("Shift not found")
        if shift.is_archived:
            raise DomainError("Shift is already archived")
        now = datetime.now(timezone.utc)
        shift.is_archived = True
        shift.archived_at = now
        shift.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        shift.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.archived", shift.id, actor_employment_id)
        return MessageResponse(message="Shift archived")

    # ==================================================================
    # Holiday calendars / holidays
    # ==================================================================

    async def create_holiday_calendar(
        self, data: HolidayCalendarCreate, *, actor_employment_id: Optional[int] = None
    ) -> HolidayCalendarResponse:
        cal = HolidayCalendar(
            name=data.name.strip(),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(cal)
        await self._commit()
        await self._audit("holiday_calendar.created", cal.id, actor_employment_id)
        await self._refresh(cal)
        return HolidayCalendarResponse.model_validate(cal)

    async def get_holiday_calendar(self, calendar_id: int) -> HolidayCalendarResponse:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        return HolidayCalendarResponse.model_validate(cal)

    async def list_holiday_calendars(
        self, *, include_archived: bool = False
    ) -> list[HolidayCalendarResponse]:
        rows = await self._repo.list_holiday_calendars(include_archived=include_archived)
        return [HolidayCalendarResponse.model_validate(r) for r in rows]

    async def update_holiday_calendar(
        self,
        calendar_id: int,
        data: HolidayCalendarUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> HolidayCalendarResponse:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        if data.name is not None:
            cal.name = data.name.strip()
        cal.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("holiday_calendar.updated", cal.id, actor_employment_id)
        await self._refresh(cal)
        return HolidayCalendarResponse.model_validate(cal)

    async def archive_holiday_calendar(
        self, calendar_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
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

    async def add_holiday(
        self, data: HolidayCreate, *, actor_employment_id: Optional[int] = None
    ) -> HolidayResponse:
        cal = await self._repo.get_holiday_calendar_by_id(data.holiday_calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        holiday = Holiday(
            holiday_calendar_id=data.holiday_calendar_id,
            name=data.name.strip(),
            date=data.date,
            holiday_type=data.holiday_type,
            recurring_flag=data.recurring_flag,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(holiday)
        await self._commit()
        await self._audit("holiday.created", holiday.id, actor_employment_id)
        await self._refresh(holiday)
        return HolidayResponse.model_validate(holiday)

    async def list_holidays(self, calendar_id: int) -> list[HolidayResponse]:
        cal = await self._repo.get_holiday_calendar_by_id(calendar_id)
        if cal is None:
            raise NotFoundError("Holiday calendar not found")
        rows = await self._repo.list_holidays_for_calendar(calendar_id)
        return [HolidayResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Locations
    # ==================================================================

    async def _validate_location_refs(
        self,
        *,
        working_week_id: Optional[int],
        holiday_calendar_id: Optional[int],
    ) -> tuple[Optional[int], Optional[int]]:
        working_week_id = _optional_id(working_week_id)
        holiday_calendar_id = _optional_id(holiday_calendar_id)
        if working_week_id is not None:
            week = await self._repo.get_working_week_by_id(working_week_id)
            if week is None:
                raise NotFoundError(f"Working week not found (id={working_week_id})")
        if holiday_calendar_id is not None:
            cal = await self._repo.get_holiday_calendar_by_id(holiday_calendar_id)
            if cal is None:
                raise NotFoundError(
                    f"Holiday calendar not found (id={holiday_calendar_id})"
                )
        return working_week_id, holiday_calendar_id

    async def create_location(
        self, data: LocationCreate, *, actor_employment_id: Optional[int] = None
    ) -> LocationResponse:
        ww_id, hc_id = await self._validate_location_refs(
            working_week_id=data.working_week_id,
            holiday_calendar_id=data.holiday_calendar_id,
        )
        loc = Location(
            name=data.name.strip(),
            timezone=data.timezone.strip(),
            working_week_id=ww_id,
            holiday_calendar_id=hc_id,
            latitude=data.latitude,
            longitude=data.longitude,
            attendance_radius_meters=data.attendance_radius_meters,
            allowed_ip_cidrs=list(data.allowed_ip_cidrs or []),
            country=data.country.strip(),
            state=data.state.strip(),
            city=data.city.strip(),
            address=data.address.strip(),
            payroll_region=data.payroll_region,
            currency=data.currency.strip(),
            fiscal_year_start_month=data.fiscal_year_start_month,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(loc)
        await self._commit()
        await self._audit("location.created", loc.id, actor_employment_id)
        await self._refresh(loc)
        return LocationResponse.model_validate(loc)

    async def get_location(self, location_id: int) -> LocationResponse:
        loc = await self._repo.get_location_by_id(location_id)
        if loc is None:
            raise NotFoundError("Location not found")
        return LocationResponse.model_validate(loc)

    async def list_locations(
        self, *, include_archived: bool = False
    ) -> list[LocationResponse]:
        rows = await self._repo.list_locations(include_archived=include_archived)
        return [LocationResponse.model_validate(r) for r in rows]

    async def update_location(
        self,
        location_id: int,
        data: LocationUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> LocationResponse:
        loc = await self._repo.get_location_by_id(location_id)
        if loc is None:
            raise NotFoundError("Location not found")

        payload = data.model_dump(exclude_unset=True)
        if "working_week_id" in payload or "holiday_calendar_id" in payload:
            ww_id, hc_id = await self._validate_location_refs(
                working_week_id=payload.get(
                    "working_week_id", loc.working_week_id
                ),
                holiday_calendar_id=payload.get(
                    "holiday_calendar_id", loc.holiday_calendar_id
                ),
            )
            if "working_week_id" in payload:
                payload["working_week_id"] = ww_id
            if "holiday_calendar_id" in payload:
                payload["holiday_calendar_id"] = hc_id

        for field, value in payload.items():
            if isinstance(value, str) and field in {
                "name",
                "timezone",
                "country",
                "state",
                "city",
                "address",
                "currency",
            }:
                value = value.strip()
            setattr(loc, field, value)

        loc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("location.updated", loc.id, actor_employment_id)
        await self._refresh(loc)
        return LocationResponse.model_validate(loc)

    async def archive_location(
        self, location_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
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

    # ==================================================================
    # Organization settings (singleton upsert)
    # ==================================================================

    async def get_organization_settings(self) -> OrganizationSettingsResponse:
        settings_row = await self._repo.get_organization_settings()
        if settings_row is None:
            raise NotFoundError(
                "Organization settings not configured — PATCH /organization/settings first"
            )
        return OrganizationSettingsResponse.model_validate(settings_row)

    async def upsert_organization_settings(
        self,
        data: OrganizationSettingsUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> OrganizationSettingsResponse:
        row = await self._repo.get_organization_settings()
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        payload = data.model_dump(exclude_unset=True)

        head_id = payload.get("head_office_location_id")
        if "head_office_location_id" in payload:
            head_id = _optional_id(head_id)
            payload["head_office_location_id"] = head_id
            if head_id is not None:
                loc = await self._repo.get_location_by_id(head_id)
                if loc is None:
                    raise NotFoundError(f"Location not found (id={head_id})")

        if row is None:
            company_name = payload.get("company_name")
            default_timezone = payload.get("default_timezone")
            default_currency = payload.get("default_currency")
            if not company_name or not default_timezone or not default_currency:
                raise DomainError(
                    "On first create, company_name, default_timezone and default_currency are required"
                )
            row = OrganizationSettings(
                company_name=str(company_name).strip(),
                head_office_location_id=payload.get("head_office_location_id"),
                default_timezone=str(default_timezone).strip(),
                default_currency=str(default_currency).strip(),
                logo_reference=payload.get("logo_reference"),
                changed_by=actor,
            )
            await self._repo.add(row)
        else:
            for field, value in payload.items():
                if isinstance(value, str) and field in {
                    "company_name",
                    "default_timezone",
                    "default_currency",
                }:
                    value = value.strip()
                setattr(row, field, value)
            row.changed_by = actor

        await self._commit()
        await self._audit("organization_settings.upserted", row.id, actor_employment_id)
        await self._refresh(row)
        return OrganizationSettingsResponse.model_validate(row)
