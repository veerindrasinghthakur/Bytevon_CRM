"""Salary management schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

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
