"""Working week schemas."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str

class WorkingWeekCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    working_days_of_week: list[int] = Field(..., min_length=1)
    effective_from: date

class WorkingWeekResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    working_days_of_week: list[int]
    effective_from: date
    effective_to: date | None = None
    created_at: datetime
    created_by: int | None = None
