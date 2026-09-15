"""My-work self-service attendance schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TodayInfoResponse(BaseModel):
    employmentId: Optional[int] = None
    todayLabel: str = "Today"
    shift: str = "—"
    status: str = "UNKNOWN"
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    workedMinutes: int = 0
    breakMinutes: int = 0
    dayId: Optional[int] = None


class WeekDayHours(BaseModel):
    date: str
    status: str
    minutes: int = 0


class WeekHoursResponse(BaseModel):
    employmentId: Optional[int] = None
    days: List[WeekDayHours] = Field(default_factory=list)
    totalMinutes: int = 0


class CorrectionListItem(BaseModel):
    id: int
    attendanceDayId: int
    status: str
    reason: str = ""
    createdAt: Optional[datetime] = None


class CorrectionListResponse(BaseModel):
    items: List[CorrectionListItem] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    pageSize: int = 20


class CorrectionCandidate(BaseModel):
    attendanceDayId: int
    date: date
    status: str
    label: str = ""


class ApproverOption(BaseModel):
    employmentId: int
    name: str
    role: str = ""
