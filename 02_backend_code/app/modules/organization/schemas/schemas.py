"""
Pydantic v2 schemas for Organization module.
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
# Department
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
    department_head_employment_id: Optional[int]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


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
# WorkingWeek
# ===========================================================================

class WorkingWeekCreate(BaseModel):
    effective_from: date
    monday: bool = True
    tuesday: bool = True
    wednesday: bool = True
    thursday: bool = True
    friday: bool = True
    saturday: bool = False
    sunday: bool = False


class WorkingWeekResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    effective_from: date
    monday: bool
    tuesday: bool
    wednesday: bool
    thursday: bool
    friday: bool
    saturday: bool
    sunday: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Shift
# ===========================================================================

class ShiftCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    start_time: time
    end_time: time
    break_minutes: int = 0
    is_overnight: bool = False
    grace_in_minutes: int = 0
    grace_out_minutes: int = 0


class ShiftUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_minutes: Optional[int] = None
    is_overnight: Optional[bool] = None
    grace_in_minutes: Optional[int] = None
    grace_out_minutes: Optional[int] = None


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    start_time: time
    end_time: time
    break_minutes: int
    is_overnight: bool
    grace_in_minutes: int
    grace_out_minutes: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# HolidayCalendar / Holiday
# ===========================================================================

class HolidayCalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    year: int


class HolidayCalendarUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)


class HolidayCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    year: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class HolidayCreate(BaseModel):
    holiday_calendar_id: int
    name: str = Field(..., min_length=1, max_length=150)
    holiday_date: date
    holiday_type: HolidayType


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    holiday_calendar_id: int
    name: str
    holiday_date: date
    holiday_type: HolidayType
    is_archived: bool
    created_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Location
# ===========================================================================

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    timezone: str = Field(..., min_length=1, max_length=64)
    latitude: Decimal
    longitude: Decimal
    attendance_radius_meters: int = 200
    allowed_ip_cidrs: List[str] = Field(default_factory=list)
    country: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1)
    payroll_region: Optional[str] = None
    currency: str = Field(..., min_length=1, max_length=10)
    fiscal_year_start_month: int = Field(1, ge=1, le=12)


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    timezone: Optional[str] = Field(None, min_length=1, max_length=64)
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    attendance_radius_meters: Optional[int] = None
    allowed_ip_cidrs: Optional[List[str]] = None
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = None
    payroll_region: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    timezone: str
    latitude: Decimal
    longitude: Decimal
    attendance_radius_meters: int
    allowed_ip_cidrs: List[str]
    country: str
    state: str
    city: str
    address: str
    payroll_region: Optional[str]
    currency: str
    fiscal_year_start_month: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


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
    head_office_location_id: Optional[int]
    default_timezone: str
    default_currency: str
    logo_reference: Optional[str]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


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
