"""Leave ledger / balance / apply-context schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.db.enums import LeaveType


class MessageResponse(BaseModel):
    message: str


class LeaveLedgerCreate(BaseModel):
    employment_id: int
    leave_type: LeaveType
    transaction_type: str = Field(..., min_length=1, max_length=50)
    days: Decimal
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None


class LeaveLedgerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    leave_type: LeaveType
    transaction_type: str
    days: Decimal
    reference_type: Optional[str]
    reference_id: Optional[int]
    created_at: datetime
    changed_by: Optional[int]


class LeaveBalanceItem(BaseModel):
    leave_type: LeaveType
    balance_days: Decimal


class LeaveBalanceResponse(BaseModel):
    employment_id: int
    balances: List[LeaveBalanceItem]


class HolidayItem(BaseModel):
    date: date
    name: str
    holiday_type: str


class LeaveTypeOptionItem(BaseModel):
    leave_type: LeaveType
    name: str
    annual_entitlement: Decimal
    description: Optional[str] = None


class ApplyLeaveBalanceItem(BaseModel):
    leave_type: LeaveType
    used: Decimal
    total: Decimal
    remaining: Decimal


class ApplyLeaveContextResponse(BaseModel):
    employment_id: int
    holidays: List[HolidayItem]
    leave_types: List[LeaveTypeOptionItem]
    balances: List[ApplyLeaveBalanceItem]


class LeaveCalculateRequest(BaseModel):
    employment_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    half_day: bool = False
    holiday_calendar_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_dates(self) -> "LeaveCalculateRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveCalculateResponse(BaseModel):
    day_cost: Decimal
    balance_remaining: Optional[Decimal] = None
    estimated_balance_after: Optional[Decimal] = None
    holidays_in_range: List[HolidayItem] = Field(default_factory=list)
