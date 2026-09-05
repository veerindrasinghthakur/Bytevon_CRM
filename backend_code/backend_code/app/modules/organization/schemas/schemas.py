"""
Pydantic v2 schemas for Organization module.
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

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
    created_by: Optional[int]


# ===========================================================================
# WorkingWeek (versioned)
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
    effective_to: Optional[date]
    created_at: datetime
    created_by: Optional[int]


# ===========================================================================
# Shift
# ===========================================================================

class ShiftCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    start_time: time
    end_time: time
    is_overnight: bool = False
    grace_late_minutes: int = Field(0, ge=0)
    flexible_end: bool = False
    break_duration_minutes: Optional[int] = Field(None, ge=0)


class ShiftUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_overnight: Optional[bool] = None
    grace_late_minutes: Optional[int] = Field(None, ge=0)
    flexible_end: Optional[bool] = None
    break_duration_minutes: Optional[int] = Field(None, ge=0)


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    start_time: time
    end_time: time
    is_overnight: bool
    grace_late_minutes: int
    flexible_end: bool
    break_duration_minutes: Optional[int]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# HolidayCalendar
# ===========================================================================

class HolidayCalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)


class HolidayCalendarUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)


class HolidayCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Holiday (append-only)
# ===========================================================================

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
    recurring_flag: bool
    created_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Location
# ===========================================================================

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    timezone: str = Field(..., min_length=1, max_length=100)
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None
    latitude: Decimal
    longitude: Decimal
    attendance_radius_meters: int = Field(..., ge=0)
    allowed_ip_cidrs: List[str] = Field(default_factory=list)
    country: str
    state: str
    city: str
    address: str
    payroll_region: Optional[str] = None
    currency: str = Field(..., min_length=1, max_length=20)
    fiscal_year_start_month: int = Field(..., ge=1, le=12)


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    timezone: Optional[str] = None
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    attendance_radius_meters: Optional[int] = Field(None, ge=0)
    allowed_ip_cidrs: Optional[List[str]] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    payroll_region: Optional[str] = None
    currency: Optional[str] = None
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    timezone: str
    working_week_id: Optional[int]
    holiday_calendar_id: Optional[int]
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
