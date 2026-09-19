"""Task domain Pydantic schemas (tasks + time entries)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    project_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    assignee_employment_id: int | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    start_date: date | None = None
    due_date: date | None = None
    estimated_hours: Decimal | None = Field(None, ge=0)


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignee_employment_id: int | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    start_date: date | None = None
    due_date: date | None = None
    estimated_hours: Decimal | None = Field(None, ge=0)
    commit_reference: str | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str | None
    assignee_employment_id: int | None
    priority: TaskPriority
    status: TaskStatus
    start_date: date | None
    due_date: date | None
    estimated_hours: Decimal | None
    completed_at: datetime | None
    commit_reference: str | None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None
    actual_minutes: int | None = None
    project_name: str | None = None


class TimeEntryCreate(BaseModel):
    task_id: int
    work_date: date
    duration_minutes: int = Field(..., gt=0)
    description: str | None = None


class TimeEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    employment_id: int
    work_date: date
    duration_minutes: int
    description: str | None
    created_at: datetime
