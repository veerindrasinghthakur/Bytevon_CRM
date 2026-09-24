"""My-work self-service attendance schemas."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class TodayInfoResponse(BaseModel):
    employmentId: int | None = None
    todayLabel: str = "Today"
    shift: str = "—"
    status: str = "UNKNOWN"
    checkIn: str | None = None
    checkOut: str | None = None
    workedMinutes: int = 0
    breakMinutes: int = 0
    dayId: int | None = None


class WeekDayHours(BaseModel):
    date: str
    status: str
    minutes: int = 0
    break_minutes: int = 0


class WeekHoursResponse(BaseModel):
    employmentId: int | None = None
    days: list[WeekDayHours] = Field(default_factory=list)
    totalMinutes: int = 0


class CorrectionListItem(BaseModel):
    id: int
    attendanceDayId: int
    status: str
    reason: str = ""
    createdAt: datetime | None = None


class CorrectionListResponse(BaseModel):
    items: list[CorrectionListItem] = Field(default_factory=list)
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
