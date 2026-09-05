"""
Pydantic v2 schemas for Payroll module.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.db.enums import PayrollItemType, PayrollStatus, SalaryItemType


class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Salary config
# ===========================================================================

class SalaryItemInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    type: SalaryItemType
    amount: Decimal = Field(..., ge=0)


class EmployeeSalaryCreate(BaseModel):
    employment_id: int
    effective_from: date
    gross_salary: Decimal = Field(..., ge=0)
    items: List[SalaryItemInput] = Field(default_factory=list)


class EmployeeSalaryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_salary_id: int
    name: str
    type: SalaryItemType
    amount: Decimal
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class EmployeeSalaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    effective_from: date
    effective_to: Optional[date]
    gross_salary: Decimal
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
    items: List[EmployeeSalaryItemResponse] = Field(default_factory=list)


# ===========================================================================
# Monthly payroll
# ===========================================================================

class PayrollCalculateRequest(BaseModel):
    employment_id: int
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    # Optional extra adjustments for this run
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


# ===========================================================================
# Bank accounts
# ===========================================================================

class BankAccountCreate(BaseModel):
    employment_id: int
    account_holder_name: str = Field(..., min_length=1, max_length=255)
    bank_name: str = Field(..., min_length=1, max_length=255)
    account_number: str = Field(..., min_length=1, max_length=100)
    ifsc_code: str = Field(..., min_length=1, max_length=20)
    account_type: str = Field(..., min_length=1, max_length=50)
    is_primary: bool = True


class BankAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    account_holder_name: str
    bank_name: str
    account_number: str
    ifsc_code: str
    account_type: str
    is_primary: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
