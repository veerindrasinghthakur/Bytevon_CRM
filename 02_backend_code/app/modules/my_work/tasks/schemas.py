"""My Work Task schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.db.enums import TaskPriority


class MyTask(BaseModel):
    id: str
    name: str
    project: str | None = None
    priority: str
    status: str
    due_date: date | None = None
    estimated_hours: Decimal | None = None
    created_at: datetime | None = None


class MyTaskListResponse(BaseModel):
    items: list[MyTask]
    total: int
    page: int = 1
    pageSize: int = 20


class MyTaskCreate(BaseModel):
    """Self-assign task create — assignee is always the caller."""

    project_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: date | None = None
    due_date: date | None = None
    estimated_hours: Decimal | None = Field(None, ge=0)


class MyProjectOption(BaseModel):
    id: int
    name: str
    status: str
