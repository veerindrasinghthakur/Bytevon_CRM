"""Shift schemas — aligned with Shift ORM model."""
from __future__ import annotations

from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class ShiftCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    start_time: time
    end_time: time
    is_overnight: bool = False
    grace_late_minutes: int = 0
    flexible_end: bool = False
    break_duration_minutes: int | None = None
    # Accepted from older clients; mapped in service
    break_minutes: int | None = None


class ShiftUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    start_time: time | None = None
    end_time: time | None = None
    is_overnight: bool | None = None
    grace_late_minutes: int | None = None
    flexible_end: bool | None = None
    break_duration_minutes: int | None = None
    break_minutes: int | None = None


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    start_time: time
    end_time: time
    is_overnight: bool = False
    grace_late_minutes: int = 0
    flexible_end: bool = False
    break_duration_minutes: int | None = None
    is_archived: bool = False
    archived_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
