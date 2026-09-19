"""Assignment + state-history schemas."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import EmploymentState, WorkMode


class MessageResponse(BaseModel):
    message: str


class EmploymentStateChangeRequest(BaseModel):
    new_state: EmploymentState
    effective_date: date
    reason: str | None = None


class EmploymentStateHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    previous_state: EmploymentState | None = None
    new_state: EmploymentState
    effective_date: date
    reason: str | None = None
    created_at: datetime
    changed_by: int | None = None


class EmploymentAssignmentCreate(BaseModel):
    department_id: int | None = None
    position_id: int | None = None
    location_id: int | None = None
    shift_id: int | None = None
    work_mode: WorkMode
    effective_from: date
    change_reason: str = Field(..., min_length=1, max_length=100)


class EmploymentAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employment_id: int
    department_id: int | None = None
    position_id: int | None = None
    location_id: int | None = None
    shift_id: int | None = None
    work_mode: WorkMode
    effective_from: date
    effective_to: date | None = None
    change_reason: str
    created_at: datetime
    changed_by: int | None = None
