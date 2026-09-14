"""Project domain Pydantic schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import (
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
)


class ProjectCreate(BaseModel):
    client_id: int
    project_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    assignment_type: ProjectAssignmentType
    assigned_to_id: int
    repository_reference: Optional[str] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    lead_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    assignment_type: Optional[ProjectAssignmentType] = None
    assigned_to_id: Optional[int] = None
    repository_reference: Optional[str] = None
    status: Optional[ProjectStatus] = None
    phase: Optional[ProjectPhase] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    lead_id: Optional[int]
    project_name: str
    description: Optional[str]
    assignment_type: ProjectAssignmentType
    assigned_to_id: int
    repository_reference: Optional[str]
    status: ProjectStatus
    phase: ProjectPhase
    created_from: ProjectSource
    planned_start_date: Optional[date]
    planned_end_date: Optional[date]
    actual_start_date: Optional[date]
    actual_end_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class ProjectDetailResponse(ProjectResponse):
    """Single-call detail payload: project + computed metrics + team summary."""

    client_name: Optional[str] = None
    open_tasks: int = 0
    task_count: int = 0
    days_to_deadline: Optional[int] = None
    team_count: int = 0
    team_member_count: int = 0
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    team_head_name: Optional[str] = None
    progress: int = 0
