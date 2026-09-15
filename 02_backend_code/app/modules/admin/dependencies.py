"""FastAPI dependencies for Admin module."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.admin.department.service import DepartmentService
from app.modules.admin.location.service import LocationService
from app.modules.admin.shift.service import ShiftService
from app.modules.admin.working_week.service import WorkingWeekService
from app.modules.admin.holiday_calendar.service import HolidayCalendarService
from app.modules.admin.settings.service import SettingsService
from app.modules.admin.user.service import UserService
from app.modules.admin.position.service import PositionService
from app.modules.admin.audit.service import AuditService


def get_department_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> DepartmentService:
    return DepartmentService(session)


def get_location_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> LocationService:
    return LocationService(session)


def get_shift_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ShiftService:
    return ShiftService(session)


def get_working_week_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> WorkingWeekService:
    return WorkingWeekService(session)


def get_holiday_calendar_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> HolidayCalendarService:
    return HolidayCalendarService(session)


def get_settings_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> SettingsService:
    return SettingsService(session)


def get_user_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> UserService:
    return UserService(session)


def get_position_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> PositionService:
    return PositionService(session)


def get_audit_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> AuditService:
    return AuditService(session)


DepartmentServiceDep = Annotated[DepartmentService, Depends(get_department_service)]
LocationServiceDep = Annotated[LocationService, Depends(get_location_service)]
ShiftServiceDep = Annotated[ShiftService, Depends(get_shift_service)]
WorkingWeekServiceDep = Annotated[WorkingWeekService, Depends(get_working_week_service)]
HolidayCalendarServiceDep = Annotated[HolidayCalendarService, Depends(get_holiday_calendar_service)]
SettingsServiceDep = Annotated[SettingsService, Depends(get_settings_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
PositionServiceDep = Annotated[PositionService, Depends(get_position_service)]
AuditServiceDep = Annotated[AuditService, Depends(get_audit_service)]
