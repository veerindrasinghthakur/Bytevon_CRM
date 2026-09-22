"""My-work overview response shapes (SELF scope aggregate)."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.modules.my_work.attendance.schemas import TodayInfoResponse, WeekHoursResponse
from app.modules.my_work.leave.schemas import LeaveBalance


class OverviewUser(BaseModel):
    name: str = "User"
    employmentId: int | None = None
    todayLabel: str = "Today"
    shift: str = "—"


class MyWorkOverviewResponse(BaseModel):
    user: OverviewUser
    todayAttendance: TodayInfoResponse | None = None
    weekHours: WeekHoursResponse | None = None
    leaveBalances: list[LeaveBalance] = Field(default_factory=list)
    tasks: list[Any] = Field(default_factory=list)
    pendingApprovals: int = 0
    metrics: list[Any] = Field(default_factory=list)
    notifications: list[Any] = Field(default_factory=list)
    events: list[Any] = Field(default_factory=list)
    quickActions: list[Any] = Field(default_factory=list)
