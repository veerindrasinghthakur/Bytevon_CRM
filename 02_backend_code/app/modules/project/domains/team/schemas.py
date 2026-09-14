"""Team domain Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    team_head_employment_id: int
    description: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    team_head_employment_id: Optional[int] = None
    description: Optional[str] = None


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    team_head_employment_id: int
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


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
    left_at: Optional[datetime]
