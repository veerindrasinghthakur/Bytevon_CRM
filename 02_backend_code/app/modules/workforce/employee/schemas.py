"""Employee / employment / person / position schemas."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.db.enums import EmploymentState, EmploymentType, WorkMode


class MessageResponse(BaseModel):
    message: str


class PersonCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date | None = None
    personal_email: EmailStr | None = None
    personal_phone: str | None = Field(None, max_length=20)
    address: str | None = None

    @field_validator("personal_email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class PersonUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    personal_email: EmailStr | None = None
    personal_phone: str | None = Field(None, max_length=20)
    address: str | None = None

    @field_validator("personal_email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class PersonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    date_of_birth: date | None = None
    personal_email: str | None = None
    personal_phone: str | None = None
    address: str | None = None
    is_anonymized: bool = False
    created_at: datetime
    updated_at: datetime


class PositionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)


class PositionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class EmploymentCreate(BaseModel):
    person_id: int
    employee_code: str = Field(..., min_length=1, max_length=50)
    employment_type: EmploymentType
    joining_date: date
    initial_state: EmploymentState = EmploymentState.ONBOARDING
    initial_state_reason: str | None = None
    department_id: int | None = None
    position_id: int | None = None
    location_id: int | None = None
    shift_id: int | None = None
    work_mode: WorkMode | None = None
    assignment_change_reason: str | None = Field(
        None, description="Required if any assignment fields are provided"
    )
    # Q9: explicit opt-in login provisioning (default false; employment and
    # login remain separate concepts).
    create_login: bool = False
    login_email: EmailStr | None = None
    login_temporary_password: str | None = Field(None, min_length=8, max_length=128)
    login_role_id: int | str | None = None


class EmployeeCreate(BaseModel):
    """One-shot employee onboarding: creates Person + Employment in one TX."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date | None = None
    personal_email: EmailStr | None = None
    personal_phone: str | None = Field(None, max_length=20)
    address: str | None = None
    employee_code: str | None = Field(None, min_length=1, max_length=50)
    employment_type: EmploymentType
    joining_date: date
    initial_state: EmploymentState = EmploymentState.ONBOARDING
    initial_state_reason: str | None = None
    department_id: int | None = None
    position_id: int | None = None
    location_id: int | None = None
    shift_id: int | None = None
    work_mode: WorkMode | None = None
    assignment_change_reason: str | None = None
    # Q9: explicit opt-in login provisioning (default false).
    create_login: bool = False
    login_email: EmailStr | None = None
    login_temporary_password: str | None = Field(None, min_length=8, max_length=128)
    login_role_id: int | str | None = None

    @field_validator("personal_email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v

    @field_validator("employee_code", mode="before")
    @classmethod
    def empty_code_to_none(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class EmploymentUpdate(BaseModel):
    employment_type: EmploymentType | None = None
    employee_code: str | None = Field(None, min_length=1, max_length=50)


class RehireRequest(BaseModel):
    """Q7: rehire a separated employment (same Person, new Employment row)."""

    employee_code: str = Field(..., min_length=1, max_length=50)
    employment_type: EmploymentType
    joining_date: date
    initial_state: EmploymentState = EmploymentState.ONBOARDING
    initial_state_reason: str | None = None
    department_id: int | None = None
    position_id: int | None = None
    location_id: int | None = None
    shift_id: int | None = None
    work_mode: WorkMode | None = None
    assignment_change_reason: str | None = None
    # Q7: reactivate the person's existing login where appropriate.
    reactivate_login: bool = True
    create_login: bool = False
    login_email: EmailStr | None = None
    login_temporary_password: str | None = Field(None, min_length=8, max_length=128)
    login_role_id: int | str | None = None


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
    changed_by: int | None = None


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


class EmploymentDetailResponse(EmploymentResponse):
    current_assignment: EmploymentAssignmentResponse | None = None
    recent_state_history: list[EmploymentStateHistoryResponse] = Field(default_factory=list)
    person: PersonResponse | None = None
