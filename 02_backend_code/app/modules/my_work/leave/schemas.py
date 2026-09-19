"""My Work Leave schemas."""
from __future__ import annotations

from datetime import date
from typing import List, Optional
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


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
    approver: Optional[str] = None
    half_day: Optional[str] = None


class LeaveListResponse(BaseModel):
    items: List[LeaveRequest]
    total: int
    page: int = 1
    pageSize: int = 20


class LeaveTypeOption(BaseModel):
    value: str
    label: str
    requires_approval: bool = True


class ApplyLeaveContext(BaseModel):
    holidays: List[dict]
    leaveTypes: List[LeaveTypeOption]
    balances: List[LeaveBalance]


class CreateLeaveRequestInput(BaseModel):
    type: str
    from_date: date
    to_date: date
    reason: str
    half_day: Optional[str] = None


class LeaveCalculateInput(BaseModel):
    type: str
    from_: str = Field(alias="from")
    to: str
    half_day: bool = False


class LeaveCalculateResult(BaseModel):
    day_cost: Decimal
    balance_remaining: Optional[Decimal] = None
    estimated_balance_after: Optional[Decimal] = None
    holidays_in_range: List[dict]