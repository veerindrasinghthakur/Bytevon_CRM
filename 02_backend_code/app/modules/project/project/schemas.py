"""Project domain Pydantic schemas."""

from __future__ import annotations

from datetime import date, datetime

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
    description: str | None = None
    assignment_type: ProjectAssignmentType
    assigned_to_id: int
    repository_reference: str | None = None
    planned_start_date: date | None = None
    planned_end_date: date | None = None
    lead_id: int | None = None


class ProjectUpdate(BaseModel):
    project_name: str | None = None
    description: str | None = None
    assignment_type: ProjectAssignmentType | None = None
    assigned_to_id: int | None = None
    repository_reference: str | None = None
    status: ProjectStatus | None = None
    phase: ProjectPhase | None = None
    planned_start_date: date | None = None
    planned_end_date: date | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    lead_id: int | None
    project_name: str
    description: str | None
    assignment_type: ProjectAssignmentType
    assigned_to_id: int
    repository_reference: str | None
    status: ProjectStatus
    phase: ProjectPhase
    created_from: ProjectSource
    planned_start_date: date | None
    planned_end_date: date | None
    actual_start_date: date | None
    actual_end_date: date | None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


class ProjectDetailResponse(ProjectResponse):
    """Single-call detail payload: project + computed metrics + team summary."""

    client_name: str | None = None
    open_tasks: int = 0
    task_count: int = 0
    days_to_deadline: int | None = None
    team_count: int = 0
    team_member_count: int = 0
    team_id: int | None = None
    team_name: str | None = None
    team_head_name: str | None = None
    progress: int = 0
