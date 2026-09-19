"""My-work attendance repository — thin reads over workforce attendance data."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.workforce.attendance.models import AttendanceDay
from app.modules.workforce.attendance.repository import AttendanceRepository as WorkforceAttendanceRepository


class MyWorkAttendanceRepository:
    """Delegates to workforce AttendanceRepository for day/punch reads."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._wf = WorkforceAttendanceRepository(session)

    async def list_days(
        self,
        employment_id: int,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> Sequence[AttendanceDay]:
        return await self._wf.list_days(
            employment_id, from_date=from_date, to_date=to_date
        )

    async def get_day_with_punches(self, day_id: int):
        return await self._wf.get_day_by_id(day_id, with_punches=True)
