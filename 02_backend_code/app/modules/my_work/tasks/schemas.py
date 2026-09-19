"""My Work Task schemas."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class MyTask(BaseModel):
    id: str
    name: str
    project: str | None = None
    priority: str
    status: str
    due_date: date | None = None
    estimated_hours: Decimal | None = None


class MyTaskListResponse(BaseModel):
    items: list[MyTask]
    total: int
    page: int = 1
    pageSize: int = 20
