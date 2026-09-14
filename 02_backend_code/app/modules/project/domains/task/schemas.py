"""Task domain Pydantic schemas (tasks + time entries)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import TaskPriority, TaskStatus


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
