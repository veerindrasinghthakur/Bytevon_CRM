"""My Work Leave schemas (self-service API shapes)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str


class LeaveBalance(BaseModel):
    type: str
    total: Decimal
    used: Decimal
    remaining: Decimal


class LeaveRequest(BaseModel):
    id: str
    type: str
    from_date: date
    to_date: date
    days: Decimal
    reason: str
    status: str
    applied_on: date
    approver: str | None = None
    approver_remarks: str | None = None
    decided_on: date | None = None
    half_day: str | None = None


class LeaveListResponse(BaseModel):
    items: list[LeaveRequest]
    total: int
    page: int = 1
    pageSize: int = 20


class LeaveTypeOption(BaseModel):
    value: str
    label: str
    requires_approval: bool = True


class ApplyLeaveContext(BaseModel):
    holidays: list[dict]
    leaveTypes: list[LeaveTypeOption]
    balances: list[LeaveBalance]


class CreateLeaveRequestInput(BaseModel):
    type: str
    from_date: date
    to_date: date
    reason: str
    half_day: str | None = None


class LeaveCalculateInput(BaseModel):
    type: str
    from_: str = Field(alias="from")
    to: str
    half_day: bool = False

    model_config = {"populate_by_name": True}


class LeaveCalculateResult(BaseModel):
    day_cost: Decimal
    balance_remaining: Decimal | None = None
    estimated_balance_after: Decimal | None = None
    holidays_in_range: list[dict] = Field(default_factory=list)
