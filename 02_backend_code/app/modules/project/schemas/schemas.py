"""
Pydantic v2 schemas for Developer / Projects module.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.db.enums import (
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)


class MessageResponse(BaseModel):
    message: str


# ===========================================================================
# Teams
# ===========================================================================

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


# ===========================================================================
# Projects
# ===========================================================================

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


# ===========================================================================
# Tasks
# ===========================================================================

class TaskCreate(BaseModel):
    project_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    assignee_employment_id: Optional[int] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_employment_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    commit_reference: Optional[str] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: Optional[str]
    assignee_employment_id: Optional[int]
    priority: TaskPriority
    status: TaskStatus
    start_date: Optional[date]
    due_date: Optional[date]
    estimated_hours: Optional[Decimal]
    completed_at: Optional[datetime]
    commit_reference: Optional[str]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]
    actual_minutes: Optional[int] = None  # derived
    project_name: Optional[str] = None  # enriched when listing


# ===========================================================================
# Time entries
# ===========================================================================

class TimeEntryCreate(BaseModel):
    task_id: int
    work_date: date
    duration_minutes: int = Field(..., gt=0)
    description: Optional[str] = None


class TimeEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    employment_id: int
    work_date: date
    duration_minutes: int
    description: Optional[str]
    created_at: datetime
