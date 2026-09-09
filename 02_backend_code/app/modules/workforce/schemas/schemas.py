"""
Pydantic v2 schemas for Workforce (employment) module.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.db.enums import EmploymentState, EmploymentType, WorkMode


class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Person (natural identity — table owned by auth module)
# ===========================================================================

class PersonCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    personal_email: Optional[EmailStr] = None
    personal_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None


class PersonUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    personal_email: Optional[EmailStr] = None
    personal_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None


class PersonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    personal_email: Optional[str] = None
    personal_phone: Optional[str] = None
    address: Optional[str] = None
    is_anonymized: bool = False
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# Position
# ===========================================================================

class PositionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)


class PositionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# Employment
# ===========================================================================

class EmploymentCreate(BaseModel):
    person_id: int
    employee_code: str = Field(..., min_length=1, max_length=50)
    employment_type: EmploymentType
    joining_date: date
    initial_state: EmploymentState = EmploymentState.ONBOARDING
    initial_state_reason: Optional[str] = None
    # Optional first assignment
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    location_id: Optional[int] = None
    shift_id: Optional[int] = None
    work_mode: Optional[WorkMode] = None
    assignment_change_reason: Optional[str] = Field(
        None, description="Required if any assignment fields are provided"
    )


class EmployeeCreate(BaseModel):
    """One-shot employee onboarding: creates Person + Employment in one TX."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    personal_email: Optional[EmailStr] = None
    personal_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None

    employee_code: str = Field(..., min_length=1, max_length=50)
    employment_type: EmploymentType
    joining_date: date
    initial_state: EmploymentState = EmploymentState.ONBOARDING
    initial_state_reason: Optional[str] = None

    department_id: Optional[int] = None
    position_id: Optional[int] = None
    location_id: Optional[int] = None
    shift_id: Optional[int] = None
    work_mode: Optional[WorkMode] = None
    assignment_change_reason: Optional[str] = None


class EmploymentUpdate(BaseModel):
    """Only non-lifecycle fields. State changes go through change_state."""

    employment_type: Optional[EmploymentType] = None
    employee_code: Optional[str] = Field(None, min_length=1, max_length=50)


class EmploymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    person_id: int
    employee_code: str
    employment_type: EmploymentType
    current_state: EmploymentState
    joining_date: date
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None


class EmploymentDetailResponse(EmploymentResponse):
    """Employment plus current assignment and recent state history."""

    current_assignment: Optional["EmploymentAssignmentResponse"] = None
    recent_state_history: List["EmploymentStateHistoryResponse"] = Field(
        default_factory=list
    )
    person: Optional[PersonResponse] = None


# ===========================================================================
# State History (append-only)
# ===========================================================================

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


# ===========================================================================
# Assignments (append-only / close previous)
# ===========================================================================

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
