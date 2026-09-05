"""
Pydantic v2 schemas for Leave module.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.db.enums import LeaveRequestStatus, LeaveType


class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Leave Policy (versioned)
# ===========================================================================

class LeavePolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    leave_type: LeaveType
    annual_entitlement: Decimal = Field(..., ge=0)
    carry_forward_limit: Optional[Decimal] = Field(None, ge=0)
    effective_from: date


class LeavePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    leave_type: LeaveType
    annual_entitlement: Decimal
    carry_forward_limit: Optional[Decimal]
    effective_from: date
    effective_to: Optional[date]
    created_at: datetime
    changed_by: Optional[int]


# ===========================================================================
# Leave Request
# ===========================================================================

class LeaveRequestCreate(BaseModel):
    employment_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None
    # Approval routing
    target_department_id: Optional[int] = None
    # ApprovalTarget defaults to DEPARTMENT_HEAD in service if not overridden

    @model_validator(mode="after")
    def validate_dates(self) -> "LeaveRequestCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str]
    approval_request_id: Optional[int]
    status: LeaveRequestStatus
    days: Optional[Decimal]
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# Leave Ledger
# ===========================================================================

class LeaveLedgerCreate(BaseModel):
    """Manual adjustment / entitlement credit (admin)."""

    employment_id: int
    leave_type: LeaveType
    transaction_type: str = Field(..., min_length=1, max_length=50)
    days: Decimal  # positive credit, negative debit
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


# ===========================================================================
# Apply-leave page context + working-day calculation
# ===========================================================================


class HolidayItem(BaseModel):
    """Holiday row for apply-leave UI (from Organization calendars)."""

    date: date
    name: str
    holiday_type: str


class LeaveTypeOptionItem(BaseModel):
    """Policy-backed leave type option for the apply form."""

    leave_type: LeaveType
    name: str
    annual_entitlement: Decimal
    description: Optional[str] = None


class ApplyLeaveBalanceItem(BaseModel):
    """UI-shaped balance for apply page cards."""

    leave_type: LeaveType
    used: Decimal
    total: Decimal
    remaining: Decimal


class ApplyLeaveContextResponse(BaseModel):
    """
    Single payload for Apply Leave page bootstrap.
    Backend owns holidays + type options + balances so the client does not
    re-derive policy/calendar rules.
    """

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
    """Working-day cost + projected balance after the request."""

    day_cost: Decimal
    balance_remaining: Optional[Decimal] = None
    estimated_balance_after: Optional[Decimal] = None
    holidays_in_range: List[HolidayItem] = Field(default_factory=list)
