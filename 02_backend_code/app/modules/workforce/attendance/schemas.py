"""Attendance schemas (workforce) — operational + policy."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.db.enums import (
    AttendanceCorrectionStatus,
    AttendanceStatus,
    PunchType,
)


class MessageResponse(BaseModel):
    message: str


class PunchRequest(BaseModel):
    employment_id: int
    punch_type: PunchType
    punch_time: Optional[datetime] = None
    attendance_date: Optional[date] = None
    shift_id: Optional[int] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    accuracy_meters: Optional[int] = None


class PunchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attendance_day_id: int
    punch_type: PunchType
    punch_time: datetime
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    accuracy_meters: Optional[int] = None
    client_ip: str
    is_valid_punch: bool
    validation_message: Optional[str] = None
    created_at: datetime


class AttendanceDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employment_id: int
    shift_id: Optional[int] = None
    attendance_date: date
    status: AttendanceStatus
    working_hours: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime


class AttendanceDayDetailResponse(AttendanceDayResponse):
    punches: List[PunchResponse] = Field(default_factory=list)


class CorrectionCreate(BaseModel):
    attendance_day_id: int
    requested_check_in: Optional[datetime] = None
    requested_check_out: Optional[datetime] = None
    reason: str = Field(..., min_length=1)
    target_department_id: Optional[int] = None

    @model_validator(mode="after")
    def at_least_one_time(self) -> "CorrectionCreate":
        if self.requested_check_in is None and self.requested_check_out is None:
            raise ValueError("At least one of requested_check_in or requested_check_out is required")
        return self


class CorrectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attendance_day_id: int
    requested_check_in: Optional[datetime] = None
    requested_check_out: Optional[datetime] = None
    reason: str
    approval_request_id: Optional[int] = None
    status: AttendanceCorrectionStatus
    created_at: datetime
    updated_at: datetime


class AttendancePolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    correction_window_days: int = Field(..., ge=0)
    max_corrections_per_month: Optional[int] = Field(None, ge=0)
    reasons_mandatory: bool = True
    approval_sla_hours: Optional[int] = None
    allow_multiple_punches: bool = True
    require_checkout_before_new_checkin: bool = False
    auto_create_attendance_day: bool = True
    default_grace_late_minutes: Optional[int] = None
    max_clock_drift_seconds: Optional[int] = None
    effective_from: date


class AttendancePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    correction_window_days: int
    max_corrections_per_month: Optional[int] = None
    reasons_mandatory: bool
    approval_sla_hours: Optional[int] = None
    allow_multiple_punches: bool
    require_checkout_before_new_checkin: bool
    auto_create_attendance_day: bool
    default_grace_late_minutes: Optional[int] = None
    max_clock_drift_seconds: Optional[int] = None
    effective_from: date
    effective_to: Optional[date] = None
    created_at: datetime
    changed_by: Optional[int] = None


class MonthlySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employment_id: int
    year: int
    month: int
    present_days: Decimal
    absent_days: Decimal
    half_days: Decimal
    holiday_days: Decimal
    week_off_days: Decimal
    on_leave_days: Decimal
    working_hours: Decimal
    overtime_hours: Optional[Decimal] = None
    late_count: Optional[int] = None
    early_departure_count: Optional[int] = None
    attendance_percentage: Optional[Decimal] = None
    rebuilt_at: datetime
    is_locked: bool
    changed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class BreakStartRequest(BaseModel):
    attendance_day_id: int
    break_start: Optional[datetime] = None


class BreakEndRequest(BaseModel):
    break_end: Optional[datetime] = None


class BreakResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attendance_day_id: int
    break_start: datetime
    break_end: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    created_at: datetime
