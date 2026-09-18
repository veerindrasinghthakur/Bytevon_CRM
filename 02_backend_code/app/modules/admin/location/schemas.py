"""Location schemas — aligned with Location ORM."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    timezone: str = "Asia/Kolkata"
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None
    latitude: Decimal = Field(default=Decimal("0"))
    longitude: Decimal = Field(default=Decimal("0"))
    attendance_radius_meters: int = 200
    allowed_ip_cidrs: List[str] = Field(default_factory=list)
    country: str = "India"
    state: str = ""
    city: str = ""
    address: str = ""
    payroll_region: Optional[str] = None
    currency: str = "INR"
    fiscal_year_start_month: int = 4


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    timezone: Optional[str] = None
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    attendance_radius_meters: Optional[int] = None
    allowed_ip_cidrs: Optional[List[str]] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    payroll_region: Optional[str] = None
    currency: Optional[str] = None
    fiscal_year_start_month: Optional[int] = None


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    timezone: str
    working_week_id: Optional[int] = None
    holiday_calendar_id: Optional[int] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    attendance_radius_meters: Optional[int] = None
    allowed_ip_cidrs: List[str] = Field(default_factory=list)
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    payroll_region: Optional[str] = None
    currency: Optional[str] = None
    fiscal_year_start_month: Optional[int] = None
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
