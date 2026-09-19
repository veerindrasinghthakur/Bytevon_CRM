"""Holiday calendar schemas — aligned with ORM."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class HolidayCalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)


class HolidayCalendarUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)


class HolidayCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class HolidayCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    holiday_date: date
    is_optional: bool = False
    recurring_flag: bool = False


class HolidayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    holiday_date: Optional[date] = None
    is_optional: Optional[bool] = None
    recurring_flag: Optional[bool] = None


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    holiday_calendar_id: int
    name: str
    date: date
    holiday_type: Optional[str] = None
    recurring_flag: bool = False
    created_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    message: str


class RecurringHolidayOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    date: date
    holiday_type: Optional[str] = None
