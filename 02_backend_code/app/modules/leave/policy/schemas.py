"""Leave policy schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import LeaveType


class LeavePolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    leave_type: LeaveType
    annual_entitlement: Decimal = Field(..., ge=0)
    carry_forward_limit: Decimal | None = Field(None, ge=0)
    effective_from: date


class LeavePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    leave_type: LeaveType
    annual_entitlement: Decimal
    carry_forward_limit: Decimal | None
    effective_from: date
    effective_to: date | None
    created_at: datetime
    changed_by: int | None
