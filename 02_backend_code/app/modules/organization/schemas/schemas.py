"""
Pydantic v2 schemas for Organization module.

Response fields must match ORM mixins:
  Department / WorkingWeek: CreatedAtMixin + created_by (no updated_at/changed_by)
  Shift / HolidayCalendar / Location / Settings: TimestampMixin + ChangedByMixin
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import HolidayType


# ===========================================================================
# Shared
# ===========================================================================

class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Department — ArchiveMixin + CreatedAtMixin + created_by
# ===========================================================================

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    department_head_employment_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    department_head_employment_id: Optional[int] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    department_head_employment_id: Optional[int] = None
    is_archived: bool = False
    created_at: datetime
    created_by: Optional[int] = None


class DepartmentEmployee(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    positionName: str = "—"
    state: str
    email: str = ""


class DepartmentAssignRequest(BaseModel):
    employmentId: int


class DepartmentEmployeeOption(BaseModel):
    value: str
    label: str
    meta: Optional[str] = None


# ===========================================================================
# WorkingWeek — EffectiveDatingMixin + CreatedAtMixin + created_by
# ===========================================================================

class WorkingWeekCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    working_days_of_week: List[int] = Field(..., min_length=1)
    effective_from: date


class WorkingWeekResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    working_days_of_week: List[int]
    effective_from: date
    effective_to: Optional[date] = None
    created_at: datetime
    created_by: Optional[int] = None


# ===========================================================================
# Shift — TimestampMixin + ChangedByMixin
# ===========================================================================

class ShiftCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    start_time: time
    end_time: time
    is_overnight: bool = False
    grace_late_minutes: int = Field(0, ge=0)
    flexible_end: bool = False
    break_duration_minutes: Optional[int] = None


class ShiftUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_overnight: Optional[bool] = None
    grace_late_minutes: Optional[int] = Field(None, ge=0)
    flexible_end: Optional[bool] = None
    break_duration_minutes: Optional[int] = None


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    start_time: time
    end_time: time
    is_overnight: bool = False
    grace_late_minutes: int = 0
    flexible_end: bool = False
    break_duration_minutes: Optional[int] = None
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None


# ===========================================================================
# HolidayCalendar / Holiday
# ===========================================================================

class HolidayCalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)


class HolidayCalendarUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)


class HolidayCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None


class HolidayCreate(BaseModel):
    holiday_calendar_id: int
    name: str = Field(..., min_length=1, max_length=150)
    date: date
    holiday_type: HolidayType
    recurring_flag: bool = False


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    holiday_calendar_id: int
    name: str
    date: date
    holiday_type: HolidayType
    recurring_flag: bool = False
    created_at: datetime
    changed_by: Optional[int] = None


# ===========================================================================
# Location
# ===========================================================================

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    timezone: str = Field(..., min_length=1, max_length=100)
    latitude: Decimal
    longitude: Decimal
    attendance_radius_meters: int = 200
    allowed_ip_cidrs: List[str] = Field(default_factory=list)
    country: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1)
    payroll_region: Optional[str] = None
    currency: str = Field(..., min_length=1, max_length=20)
    fiscal_year_start_month: int = Field(1, ge=1, le=12)
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    timezone: Optional[str] = Field(None, min_length=1, max_length=100)
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    attendance_radius_meters: Optional[int] = None
    allowed_ip_cidrs: Optional[List[str]] = None
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = None
    payroll_region: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=1, max_length=20)
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    timezone: str
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None
    latitude: Decimal
    longitude: Decimal
    attendance_radius_meters: int
    allowed_ip_cidrs: List[str] = Field(default_factory=list)
    country: str
    state: str
    city: str
    address: str
    payroll_region: Optional[str] = None
    currency: str
    fiscal_year_start_month: int
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None


# ===========================================================================
# OrganizationSettings (singleton)
# ===========================================================================

class OrganizationSettingsUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    head_office_location_id: Optional[int] = None
    default_timezone: Optional[str] = None
    default_currency: Optional[str] = None
    logo_reference: Optional[str] = None


class OrganizationSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    head_office_location_id: Optional[int] = None
    default_timezone: str
    default_currency: str
    logo_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None


# ===========================================================================
# Admin Users (login accounts linked via person → employment)
# ===========================================================================

class AdminUserCreate(BaseModel):
    employmentId: int
    email: EmailStr
    temporaryPassword: str = Field(..., min_length=8)
    roleId: Optional[Union[int, str]] = None
    status: Optional[str] = "ACTIVE"


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    temporaryPassword: Optional[str] = Field(None, min_length=8)
    status: Optional[str] = None
    departmentId: Optional[int] = None
    roleId: Optional[Union[int, str]] = None
    failed_attempt_count: Optional[int] = None
    locked_until: Optional[datetime] = None


class AdminUserListItem(BaseModel):
    id: int
    employmentId: int
    name: str
    email: str
    role: str
    department: str
    status: str
    lastLogin: str
    lastLoginAt: Optional[datetime] = None
    initials: str
    employeeCode: str


class AdminUserListResponse(BaseModel):
    items: List[AdminUserListItem]
    total: int
    locked: int
    active: int
    departments: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)


class EmploymentWithoutLogin(BaseModel):
    employmentId: int
    employeeCode: str
    name: str
    department: str
    position: str
    joiningDate: Optional[date] = None


class AdminUserDetailResponse(BaseModel):
    id: int
    employmentId: int
    email: str
    name: str
    status: str
    department: str
    departmentId: Optional[int] = None
    role: str
    roleIds: List[str] = Field(default_factory=list)
    roleNames: List[str] = Field(default_factory=list)
    lastLogin: str
    lastLoginAt: Optional[datetime] = None
    initials: str
    employeeCode: str
    failed_attempt_count: int = 0
    locked_until: Optional[datetime] = None
    person: Optional[dict] = None
    employment: Optional[dict] = None
