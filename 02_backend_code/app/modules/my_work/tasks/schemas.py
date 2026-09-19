"""My Work Task schemas."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MyTask(BaseModel):
    id: str
    name: str
    project: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = None


class MyTaskListResponse(BaseModel):
    items: List[MyTask]
    total: int
    page: int = 1
    pageSize: int = 20