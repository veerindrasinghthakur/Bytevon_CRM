"""Team domain Pydantic schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    team_head_employment_id: int
    description: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    team_head_employment_id: int | None = None
    description: str | None = None


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    team_head_employment_id: int
    description: str | None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None
    is_archived: bool = False
    head_name: str | None = None
    department_name: str | None = None
    member_count: int | None = None
    project_count: int | None = None


class TeamMemberAdd(BaseModel):
    employment_id: int
    team_role: str = Field(..., min_length=1, max_length=100)


class TeamMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_id: int
    employment_id: int
    team_role: str
    joined_at: datetime
    left_at: datetime | None
    is_member: bool = True
    person_name: str | None = None
    employee_code: str | None = None
    department_name: str | None = None
