"""Monthly payroll schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import PayrollItemType, PayrollStatus, SalaryItemType


class MessageResponse(BaseModel):
    message: str


class SalaryItemInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    type: SalaryItemType
    amount: Decimal = Field(..., ge=0)


class PayrollCalculateRequest(BaseModel):
    employment_id: int
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    adjustments: list[SalaryItemInput] = Field(default_factory=list)


class PayrollPaymentRequest(BaseModel):
    payment_method: str = Field(..., min_length=1, max_length=50)
    payment_reference: str | None = None
    payment_date: date | None = None


class MonthlyPayrollItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    monthly_payroll_id: int
    name: str
    type: PayrollItemType
    amount: Decimal
    description: str | None


class MonthlyPayrollResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employment_id: int
    year: int
    month: int
    gross_salary: Decimal
    total_earnings: Decimal
    total_deductions: Decimal
    net_salary: Decimal
    status: PayrollStatus
    payment_method: str | None
    payment_reference: str | None
    payment_date: date | None
    payable_days: Decimal | None
    lop_days: Decimal | None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None
    items: list[MonthlyPayrollItemResponse] = Field(default_factory=list)
