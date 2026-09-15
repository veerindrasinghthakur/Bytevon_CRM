"""Monthly payroll schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

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
    adjustments: List[SalaryItemInput] = Field(default_factory=list)


class PayrollPaymentRequest(BaseModel):
    payment_method: str = Field(..., min_length=1, max_length=50)
    payment_reference: Optional[str] = None
    payment_date: Optional[date] = None


class MonthlyPayrollItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    monthly_payroll_id: int
    name: str
    type: PayrollItemType
    amount: Decimal
    description: Optional[str]


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
    payment_method: Optional[str]
    payment_reference: Optional[str]
    payment_date: Optional[date]
    payable_days: Optional[Decimal]
    lop_days: Optional[Decimal]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
    items: List[MonthlyPayrollItemResponse] = Field(default_factory=list)
