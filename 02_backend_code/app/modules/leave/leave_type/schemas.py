"""Leave type master schemas (WHAT the leave is)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LeaveTypeCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    is_paid: bool = True
    requires_approval: bool = True
    requires_document: bool = False
    allow_half_day: bool = True
    allow_hourly: bool = False
    is_encashable: bool = False
    default_annual_entitlement: Decimal = Field(Decimal("0"), ge=0)
    is_active: bool = True
    sort_order: int = 0

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper().replace(" ", "_").replace("-", "_")


class LeaveTypeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    is_paid: bool | None = None
    requires_approval: bool | None = None
    requires_document: bool | None = None
    allow_half_day: bool | None = None
    allow_hourly: bool | None = None
    is_encashable: bool | None = None
    default_annual_entitlement: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None
    sort_order: int | None = None


class LeaveTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None
    is_paid: bool
    requires_approval: bool
    requires_document: bool
    allow_half_day: bool
    allow_hourly: bool
    is_encashable: bool
    default_annual_entitlement: Decimal
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
