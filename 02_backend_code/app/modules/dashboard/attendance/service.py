"""DashboardAttendanceService — computed metrics from existing domain services."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.dashboard.attendance.schemas import (
    AttendanceHours,
    AttendancePolicyBlock,
    AttendanceRange,
    AttendanceRates,
    AttendanceStreaks,
    AttendanceTotals,
    DashboardAttendanceResponse,
)
from app.modules.my_work.attendance.service import MyWorkAttendanceService
from app.modules.workforce.attendance.service import AttendanceService as WorkforceAttendanceService


def _status_key(status: object) -> str:
    return status.value if hasattr(status, "value") else str(status)


class DashboardAttendanceService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._wf = WorkforceAttendanceService(session)
        self._self = MyWorkAttendanceService(session)

    async def get_attendance(
        self,
        employment_id: int | None,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
        year: int | None = None,
        month: int | None = None,
        scope: str = "SELF",
    ) -> DashboardAttendanceResponse:
        if employment_id is None:
            return DashboardAttendanceResponse(scope=scope, employmentId=None)
        today = date.today()
        start = from_date or date.fromordinal(max(1, today.toordinal() - 29))
        end = to_date or today
        days = await self._wf.list_days(employment_id, from_date=start, to_date=end)

        totals = AttendanceTotals()
        worked_minutes = 0
        present_streak = 0
        longest = 0
        for d in days:
            key = _status_key(d.status).upper()
            if key == "PRESENT":
                totals.present += 1
                present_streak += 1
                longest = max(longest, present_streak)
            elif key == "ABSENT":
                totals.absent += 1
                present_streak = 0
            elif key in ("HALF_DAY", "HALF"):
                totals.half += 1
                present_streak = 0
            elif key == "ON_LEAVE":
                totals.onLeave += 1
                present_streak = 0
            elif key == "HOLIDAY":
                totals.holiday += 1
            elif key == "WEEK_OFF":
                totals.weekOff += 1
            else:
                present_streak = 0
            worked_minutes += int(float(d.working_hours or 0) * 60)

        expected = totals.present + totals.absent + totals.half
        attendance_pct = (
            round((totals.present + 0.5 * totals.half) / expected * 100, 1) if expected else 0.0
        )

        week = await self._self.week_hours(employment_id)
        corrections = await self._wf.list_corrections_by_employment(employment_id, limit=200)
        pending = sum(
            1 for c in corrections if _status_key(c.status).upper() == "PENDING"
        )

        month_payload: dict | None = None
        overtime = 0.0
        y = year or today.year
        m = month or today.month
        try:
            summary = await self._wf.get_monthly_summary(employment_id, y, m)
            month_payload = summary.model_dump(mode="json")
            overtime = float(getattr(summary, "overtime_hours", 0) or 0)
        except Exception:
            month_payload = None

        policy_block = AttendancePolicyBlock()
        try:
            policy = await self._wf.get_current_policy(as_of=end)
            policy_block = AttendancePolicyBlock(
                correction_window_days=policy.correction_window_days,
                grace_late_minutes=policy.default_grace_late_minutes,
                max_corrections_per_month=policy.max_corrections_per_month,
            )
        except Exception:
            pass

        return DashboardAttendanceResponse(
            scope=scope,
            employmentId=employment_id,
            range=AttendanceRange(from_date=start.isoformat(), to_date=end.isoformat()),
            totals=totals,
            rates=AttendanceRates(attendancePct=attendance_pct),
            hours=AttendanceHours(
                worked=round(worked_minutes / 60.0, 2),
                overtime=overtime,
                totalMinutes=worked_minutes,
            ),
            streaks=AttendanceStreaks(current=present_streak, longest=longest),
            week=[d.model_dump(mode="json") for d in week.days],
            month=month_payload,
            corrections={"pending": pending, "total": len(corrections)},
            policy=policy_block,
        )


AttendanceDashboardService = DashboardAttendanceService
