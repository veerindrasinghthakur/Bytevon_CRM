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

    # ==================================================================
    # Departments
    # ==================================================================

    async def create_department(
        self,
        data: DepartmentCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DepartmentResponse:
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
            dept.name = data.name

        if data.department_head_employment_id is not None:
            dept.department_head_employment_id = data.department_head_employment_id

        await self._commit()
        await self._audit("department.updated", dept.id, actor_employment_id)
        return DepartmentResponse.model_validate(dept)

    async def archive_department(
        self,
        department_id: int,
        *,
        actor_employment_id: Optional[int] = None,
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
    # Working Weeks (versioned — never overwrite)
    # ==================================================================

    async def create_working_week(
        self,
        data: WorkingWeekCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> WorkingWeekResponse:
        current = await self._repo.get_current_working_week(as_of=data.effective_from)
        if current and current.effective_to is None:
            from datetime import timedelta as _td
            close_to = data.effective_from - _td(days=1)
            if close_to >= current.effective_from:
                await self._repo.close_working_week(current.id, close_to)

        week = WorkingWeek(
            name=data.name,
            working_days_of_week=data.working_days_of_week,
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

    async def get_current_working_week(
        self, *, as_of: Optional[date] = None
    ) -> WorkingWeekResponse:
        week = await self._repo.get_current_working_week(as_of=as_of)
        if week is None:
            raise NotFoundError("No effective working week found")
        return WorkingWeekResponse.model_validate(week)

    async def list_working_weeks(self) -> list[WorkingWeekResponse]:
        rows = await self._repo.list_working_weeks()
        return [WorkingWeekResponse.model_validate(r) for r in rows]

    # Remaining organization methods (shifts, holidays, locations, settings)
    # are unchanged — see repository history. Admin user methods live on AdminUsersMixin.

    async def create_shift(self, data: ShiftCreate, *, actor_employment_id: Optional[int] = None) -> ShiftResponse:
        shift = Shift(
            name=data.name,
            start_time=data.start_time,
            end_time=data.end_time,
            is_overnight=getattr(data, 'is_overnight', False),
            grace_late_minutes=getattr(data, 'grace_late_minutes', getattr(data, 'grace_in_minutes', 0)),
            flexible_end=getattr(data, 'flexible_end', False),
            break_duration_minutes=getattr(data, 'break_duration_minutes', getattr(data, 'break_minutes', 0)),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
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
            setattr(shift, field, value)
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
        shift.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("shift.archived", shift.id, actor_employment_id)
        return MessageResponse(message="Shift archived")

    async def get_organization_settings(self) -> OrganizationSettingsResponse:
        settings_row = await self._repo.get_organization_settings()
        if settings_row is None:
            raise NotFoundError("Organization settings not configured")
        return OrganizationSettingsResponse.model_validate(settings_row)

    async def upsert_organization_settings(
        self, data: OrganizationSettingsUpdate, *, actor_employment_id: Optional[int] = None
    ) -> OrganizationSettingsResponse:
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
            payload = data.model_dump(exclude_unset=True)
            for field, value in payload.items():
                setattr(row, field, value)
            row.changed_by = actor
        await self._commit()
        await self._audit("organization_settings.upserted", row.id, actor_employment_id)
        return OrganizationSettingsResponse.model_validate(row)
