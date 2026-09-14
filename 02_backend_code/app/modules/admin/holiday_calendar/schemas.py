"""Holiday calendar schemas."""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class HolidayCalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    year: int


class HolidayCalendarUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    year: Optional[int] = None


class HolidayCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    year: int
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class HolidayCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    holiday_date: date
    is_optional: bool = False


class HolidayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    holiday_date: Optional[date] = None
    is_optional: Optional[bool] = None


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    calendar_id: int
    name: str
    holiday_date: date
    is_optional: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
