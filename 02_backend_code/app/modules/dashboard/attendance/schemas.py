"""Dashboard attendance response shapes."""
from __future__ import annotations

from pydantic import BaseModel, Field


class AttendanceRange(BaseModel):
    from_date: str | None = None
    to_date: str | None = None


class AttendanceTotals(BaseModel):
    present: int = 0
    absent: int = 0
    half: int = 0
    onLeave: int = 0
    holiday: int = 0
    weekOff: int = 0


class AttendanceRates(BaseModel):
    attendancePct: float = 0.0
    punctualityPct: float | None = None


class AttendanceHours(BaseModel):
    worked: float = 0.0
    overtime: float = 0.0
    totalMinutes: int = 0


class AttendanceStreaks(BaseModel):
    current: int = 0
    longest: int = 0


class AttendancePolicyBlock(BaseModel):
    correction_window_days: int | None = None
    grace_late_minutes: int | None = None
    max_corrections_per_month: int | None = None


class DashboardAttendanceResponse(BaseModel):
    scope: str = "SELF"
    employmentId: int | None = None
    range: AttendanceRange = Field(default_factory=AttendanceRange)
    totals: AttendanceTotals = Field(default_factory=AttendanceTotals)
    rates: AttendanceRates = Field(default_factory=AttendanceRates)
    hours: AttendanceHours = Field(default_factory=AttendanceHours)
    streaks: AttendanceStreaks = Field(default_factory=AttendanceStreaks)
    week: list[dict] = Field(default_factory=list)
    month: dict | None = None
    corrections: dict = Field(default_factory=lambda: {"pending": 0, "total": 0})
    policy: AttendancePolicyBlock = Field(default_factory=AttendancePolicyBlock)
