"""Attendance repository (workforce)."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db.enums import AttendanceCorrectionStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.workforce.attendance.models import (
    AttendanceBreak,
    AttendanceCorrection,
    AttendanceDay,
    AttendancePolicy,
    AttendancePunch,
    MonthlyAttendanceSummary,
)


class AttendanceRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_day_by_id(
        self, day_id: int, *, with_punches: bool = False
    ) -> AttendanceDay | None:
        stmt = select(AttendanceDay).where(AttendanceDay.id == day_id)
        if with_punches:
            stmt = stmt.options(selectinload(AttendanceDay.punches))
        return await self.scalar_one_or_none(stmt)

    async def get_day_by_employment_date(
        self, employment_id: int, attendance_date: date
    ) -> AttendanceDay | None:
        stmt = select(AttendanceDay).where(
            AttendanceDay.employment_id == employment_id,
            AttendanceDay.attendance_date == attendance_date,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_days(
        self,
        employment_id: int,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> Sequence[AttendanceDay]:
        stmt = (
            select(AttendanceDay)
            .where(AttendanceDay.employment_id == employment_id)
            .order_by(AttendanceDay.attendance_date.desc())
        )
        if from_date is not None:
            stmt = stmt.where(AttendanceDay.attendance_date >= from_date)
        if to_date is not None:
            stmt = stmt.where(AttendanceDay.attendance_date <= to_date)
        return await self.scalars(stmt)

    async def list_days_for_month(
        self, employment_id: int, year: int, month: int
    ) -> Sequence[AttendanceDay]:
        from calendar import monthrange

        last = monthrange(year, month)[1]
        return await self.list_days(
            employment_id,
            from_date=date(year, month, 1),
            to_date=date(year, month, last),
        )

    async def list_punches(self, attendance_day_id: int) -> Sequence[AttendancePunch]:
        stmt = (
            select(AttendancePunch)
            .where(AttendancePunch.attendance_day_id == attendance_day_id)
            .order_by(AttendancePunch.punch_time)
        )
        return await self.scalars(stmt)

    async def get_last_punch(
        self, attendance_day_id: int
    ) -> AttendancePunch | None:
        stmt = (
            select(AttendancePunch)
            .where(AttendancePunch.attendance_day_id == attendance_day_id)
            .order_by(AttendancePunch.punch_time.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def get_correction_by_id(
        self, correction_id: int
    ) -> AttendanceCorrection | None:
        stmt = select(AttendanceCorrection).where(
            AttendanceCorrection.id == correction_id
        )
        return await self.scalar_one_or_none(stmt)

    async def list_corrections_by_employment(
        self, employment_id: int, *, limit: int = 50
    ) -> Sequence[AttendanceCorrection]:
        """Q14: corrections for one employment (joins the day owner)."""
        stmt = (
            select(AttendanceCorrection)
            .join(
                AttendanceDay,
                AttendanceDay.id == AttendanceCorrection.attendance_day_id,
            )
            .where(AttendanceDay.employment_id == employment_id)
            .order_by(AttendanceCorrection.id.desc())
            .limit(limit)
        )
        return await self.scalars(stmt)

    async def count_corrections_in_month(
        self, employment_id: int, year: int, month: int
    ) -> int:
        from calendar import monthrange

        from sqlalchemy import func

        last = monthrange(year, month)[1]
        stmt = (
            select(func.count())
            .select_from(AttendanceCorrection)
            .join(AttendanceDay)
            .where(
                AttendanceDay.employment_id == employment_id,
                AttendanceDay.attendance_date >= date(year, month, 1),
                AttendanceDay.attendance_date <= date(year, month, last),
                AttendanceCorrection.status.in_(
                    [
                        AttendanceCorrectionStatus.PENDING,
                        AttendanceCorrectionStatus.APPROVED,
                    ]
                ),
            )
        )
        result = await self.execute(stmt)
        return int(result.scalar() or 0)

    async def get_current_policy(
        self, *, as_of: date | None = None
    ) -> AttendancePolicy | None:
        as_of = as_of or date.today()
        stmt = (
            select(AttendancePolicy)
            .where(
                AttendancePolicy.effective_from <= as_of,
                (AttendancePolicy.effective_to.is_(None))
                | (AttendancePolicy.effective_to > as_of),
            )
            .order_by(AttendancePolicy.effective_from.desc(), AttendancePolicy.id.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_policies(self) -> Sequence[AttendancePolicy]:
        stmt = select(AttendancePolicy).order_by(
            AttendancePolicy.effective_from.desc(), AttendancePolicy.id.desc()
        )
        return await self.scalars(stmt)

    async def close_policy(self, policy_id: int, effective_to: date) -> None:
        stmt = (
            update(AttendancePolicy)
            .where(AttendancePolicy.id == policy_id)
            .values(effective_to=effective_to)
        )
        await self.execute(stmt)

    async def get_monthly_summary(
        self, employment_id: int, year: int, month: int
    ) -> MonthlyAttendanceSummary | None:
        stmt = select(MonthlyAttendanceSummary).where(
            MonthlyAttendanceSummary.employment_id == employment_id,
            MonthlyAttendanceSummary.year == year,
            MonthlyAttendanceSummary.month == month,
        )
        return await self.scalar_one_or_none(stmt)

    async def get_break_by_id(self, break_id: int) -> AttendanceBreak | None:
        stmt = select(AttendanceBreak).where(AttendanceBreak.id == break_id)
        return await self.scalar_one_or_none(stmt)

    async def get_open_break(
        self, attendance_day_id: int
    ) -> AttendanceBreak | None:
        stmt = (
            select(AttendanceBreak)
            .where(
                AttendanceBreak.attendance_day_id == attendance_day_id,
                AttendanceBreak.break_end.is_(None),
            )
            .order_by(AttendanceBreak.break_start.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)
