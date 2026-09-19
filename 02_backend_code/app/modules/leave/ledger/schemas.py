"""Leave ledger / balance / apply-context schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.db.enums import LeaveType


class MessageResponse(BaseModel):
    message: str


class LeaveLedgerCreate(BaseModel):
    employment_id: int
    leave_type: LeaveType
    transaction_type: str = Field(..., min_length=1, max_length=50)
    days: Decimal
    reference_type: str | None = None
    reference_id: int | None = None


class LeaveLedgerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    leave_type: LeaveType
    transaction_type: str
    days: Decimal
    reference_type: str | None
    reference_id: int | None
    created_at: datetime
    changed_by: int | None


class LeaveBalanceItem(BaseModel):
    leave_type: LeaveType
    balance_days: Decimal


class LeaveBalanceResponse(BaseModel):
    employment_id: int
    balances: list[LeaveBalanceItem]


class HolidayItem(BaseModel):
    date: date
    name: str
    holiday_type: str


class LeaveTypeOptionItem(BaseModel):
    leave_type: LeaveType
    name: str
    annual_entitlement: Decimal
    description: str | None = None


class ApplyLeaveBalanceItem(BaseModel):
    leave_type: LeaveType
    used: Decimal
    total: Decimal
    remaining: Decimal


class ApplyLeaveContextResponse(BaseModel):
    employment_id: int
    holidays: list[HolidayItem]
    leave_types: list[LeaveTypeOptionItem]
    balances: list[ApplyLeaveBalanceItem]


class LeaveCalculateRequest(BaseModel):
    employment_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    half_day: bool = False
    holiday_calendar_id: int | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> LeaveCalculateRequest:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveCalculateResponse(BaseModel):
    day_cost: Decimal
    balance_remaining: Decimal | None = None
    estimated_balance_after: Decimal | None = None
    holidays_in_range: list[HolidayItem] = Field(default_factory=list)
