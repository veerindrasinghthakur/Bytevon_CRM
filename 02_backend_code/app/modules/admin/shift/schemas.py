"""Shift schemas — aligned with Shift ORM model."""
from __future__ import annotations
from datetime import datetime, time
from typing import Optional
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
    break_duration_minutes: Optional[int] = None
    # Accepted from older clients; mapped in service
    break_minutes: Optional[int] = None


class ShiftUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_overnight: Optional[bool] = None
    grace_late_minutes: Optional[int] = None
    flexible_end: Optional[bool] = None
    break_duration_minutes: Optional[int] = None
    break_minutes: Optional[int] = None


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    start_time: time
    end_time: time
    is_overnight: bool = False
    grace_late_minutes: int = 0
    flexible_end: bool = False
    break_duration_minutes: Optional[int] = None
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
