"""Assignment + state-history schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import EmploymentState, WorkMode


class MessageResponse(BaseModel):
    message: str


class EmploymentStateChangeRequest(BaseModel):
    new_state: EmploymentState
    effective_date: date
    reason: Optional[str] = None


class EmploymentStateHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    previous_state: Optional[EmploymentState] = None
    new_state: EmploymentState
    effective_date: date
    reason: Optional[str] = None
    created_at: datetime
    changed_by: Optional[int] = None


class EmploymentAssignmentCreate(BaseModel):
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    location_id: Optional[int] = None
    shift_id: Optional[int] = None
    work_mode: WorkMode
    effective_from: date
    change_reason: str = Field(..., min_length=1, max_length=100)


class EmploymentAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    location_id: Optional[int] = None
    shift_id: Optional[int] = None
    work_mode: WorkMode
    effective_from: date
    effective_to: Optional[date] = None
    change_reason: str
    created_at: datetime
    changed_by: Optional[int] = None
