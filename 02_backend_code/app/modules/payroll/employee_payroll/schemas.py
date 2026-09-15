"""Employee payroll / bank schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


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
