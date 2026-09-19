"""Attendance schemas (workforce) — operational + policy."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    punch_time: datetime | None = None
    attendance_date: date | None = None
    shift_id: int | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    accuracy_meters: int | None = None


class PunchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attendance_day_id: int
    punch_type: PunchType
    punch_time: datetime
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    accuracy_meters: int | None = None
    client_ip: str
    is_valid_punch: bool
    validation_message: str | None = None
    created_at: datetime

    @field_validator("client_ip", mode="before")
    @classmethod
    def coerce_ip_to_str(cls, v: object) -> object:
        # asyncpg returns INET columns as ipaddress objects; API emits strings.
        return str(v) if v is not None else v


class AttendanceDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employment_id: int
    shift_id: int | None = None
    attendance_date: date
    status: AttendanceStatus
    working_hours: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class AttendanceDayDetailResponse(AttendanceDayResponse):
    punches: list[PunchResponse] = Field(default_factory=list)


class CorrectionCreate(BaseModel):
    attendance_day_id: int
    requested_check_in: datetime | None = None
    requested_check_out: datetime | None = None
    reason: str = Field(..., min_length=1)
    target_department_id: int | None = None

    @model_validator(mode="after")
    def at_least_one_time(self) -> CorrectionCreate:
        if self.requested_check_in is None and self.requested_check_out is None:
            raise ValueError("At least one of requested_check_in or requested_check_out is required")
        return self


class CorrectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attendance_day_id: int
    requested_check_in: datetime | None = None
    requested_check_out: datetime | None = None
    reason: str
    approval_request_id: int | None = None
    status: AttendanceCorrectionStatus
    created_at: datetime
    updated_at: datetime


class AttendancePolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    correction_window_days: int = Field(..., ge=0)
    max_corrections_per_month: int | None = Field(None, ge=0)
    reasons_mandatory: bool = True
    approval_sla_hours: int | None = None
    allow_multiple_punches: bool = True
    require_checkout_before_new_checkin: bool = False
    auto_create_attendance_day: bool = True
    default_grace_late_minutes: int | None = None
    max_clock_drift_seconds: int | None = None
    effective_from: date


class AttendancePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    correction_window_days: int
    max_corrections_per_month: int | None = None
    reasons_mandatory: bool
    approval_sla_hours: int | None = None
    allow_multiple_punches: bool
    require_checkout_before_new_checkin: bool
    auto_create_attendance_day: bool
    default_grace_late_minutes: int | None = None
    max_clock_drift_seconds: int | None = None
    effective_from: date
    effective_to: date | None = None
    created_at: datetime
    changed_by: int | None = None


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
    overtime_hours: Decimal | None = None
    late_count: int | None = None
    early_departure_count: int | None = None
    attendance_percentage: Decimal | None = None
    rebuilt_at: datetime
    is_locked: bool
    changed_by: int | None = None
    created_at: datetime
    updated_at: datetime


class BreakStartRequest(BaseModel):
    attendance_day_id: int
    break_start: datetime | None = None


class BreakEndRequest(BaseModel):
    break_end: datetime | None = None


class BreakResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attendance_day_id: int
    break_start: datetime
    break_end: datetime | None = None
    duration_minutes: int | None = None
    created_at: datetime
