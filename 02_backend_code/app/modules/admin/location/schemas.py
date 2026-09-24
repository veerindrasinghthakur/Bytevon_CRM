"""Location schemas — aligned with Location ORM."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    timezone: str = "Asia/Kolkata"
    working_week_id: int | None = None
    holiday_calendar_id: int | None = None
    latitude: Decimal = Field(default=Decimal("0"))
    longitude: Decimal = Field(default=Decimal("0"))
    attendance_radius_meters: int = 200
    allowed_ip_cidrs: list[str] = Field(default_factory=list)
    country: str = "India"
    state: str = ""
    city: str = ""
    address: str = ""
    payroll_region: str | None = None
    currency: str = "INR"
    fiscal_year_start_month: int = 4


class LocationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    timezone: str | None = None
    working_week_id: int | None = None
    holiday_calendar_id: int | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    attendance_radius_meters: int | None = None
    allowed_ip_cidrs: list[str] | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None
    payroll_region: str | None = None
    currency: str | None = None
    fiscal_year_start_month: int | None = None


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    timezone: str
    working_week_id: int | None = None
    holiday_calendar_id: int | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    attendance_radius_meters: int | None = None
    allowed_ip_cidrs: list[str] = Field(default_factory=list)
    country: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None
    payroll_region: str | None = None
    currency: str | None = None
    fiscal_year_start_month: int | None = None
    is_archived: bool = False
    archived_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
