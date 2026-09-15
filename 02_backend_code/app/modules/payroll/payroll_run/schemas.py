"""Payroll run schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str


class RunPayrollBody(BaseModel):
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    employment_id: Optional[int] = None
