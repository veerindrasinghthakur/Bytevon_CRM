"""Holiday calendar schemas — aligned with ORM."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class HolidayCalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)


class HolidayCalendarUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)


class HolidayCalendarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    is_archived: bool = False
    archived_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class HolidayCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    holiday_date: date
    is_optional: bool = False
    recurring_flag: bool = False


class HolidayUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    holiday_date: date | None = None
    is_optional: bool | None = None
    recurring_flag: bool | None = None


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    holiday_calendar_id: int
    name: str
    date: date
    holiday_type: str | None = None
    recurring_flag: bool = False
    created_at: datetime | None = None


class RecurringHolidayOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    date: date
    holiday_type: str | None = None
