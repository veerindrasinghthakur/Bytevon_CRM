"""Shift schemas."""
from __future__ import annotations
from datetime import datetime, time
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class ShiftCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    start_time: time
    end_time: time
    break_minutes: int = 0
    is_overnight: bool = False


class ShiftUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_minutes: Optional[int] = None
    is_overnight: Optional[bool] = None


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    start_time: time
    end_time: time
    break_minutes: int = 0
    is_overnight: bool = False
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
