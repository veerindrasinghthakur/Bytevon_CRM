"""Salary management schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import SalaryItemType


class MessageResponse(BaseModel):
    message: str


class SalaryItemInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    type: SalaryItemType
    amount: Decimal = Field(..., ge=0)


class EmployeeSalaryCreate(BaseModel):
    employment_id: int
    effective_from: date
    gross_salary: Decimal = Field(..., ge=0)
    items: list[SalaryItemInput] = Field(default_factory=list)


class EmployeeSalaryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_salary_id: int
    name: str
    type: SalaryItemType
    amount: Decimal
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


class EmployeeSalaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employment_id: int
    effective_from: date
    effective_to: date | None
    gross_salary: Decimal
    created_at: datetime
    updated_at: datetime
    changed_by: int | None
    items: list[EmployeeSalaryItemResponse] = Field(default_factory=list)
