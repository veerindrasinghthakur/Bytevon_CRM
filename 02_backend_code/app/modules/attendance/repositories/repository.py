"""
AttendanceRepository — domain-specific queries only.
"""

from __future__ import annotations

from datetime import date
from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db.enums import AttendanceCorrectionStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.attendance.models import (
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

    # ------------------------------------------------------------------
    # Days
    # ------------------------------------------------------------------

    async def get_day_by_id(
        self, day_id: int, *, with_punches: bool = False
    ) -> Optional[AttendanceDay]:
        stmt = select(AttendanceDay).where(AttendanceDay.id == day_id)
        if with_punches:
            stmt = stmt.options(selectinload(AttendanceDay.punches))
        return await self.scalar_one_or_none(stmt)

    async def get_day_by_employment_date(
        self, employment_id: int, attendance_date: date
    ) -> Optional[AttendanceDay]:
        stmt = select(AttendanceDay).where(
            AttendanceDay.employment_id == employment_id,
            AttendanceDay.attendance_date == attendance_date,
        )
        return await self.scalar_one_or_none(stmt)

    async def list_days(
        self,
        employment_id: int,
        *,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
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

    # ------------------------------------------------------------------
    # Punches
    # ------------------------------------------------------------------

    async def list_punches(self, attendance_day_id: int) -> Sequence[AttendancePunch]:
        stmt = (
            select(AttendancePunch)
            .where(AttendancePunch.attendance_day_id == attendance_day_id)
            .order_by(AttendancePunch.punch_time)
        )
        return await self.scalars(stmt)

    async def get_last_punch(
        self, attendance_day_id: int
    ) -> Optional[AttendancePunch]:
        stmt = (
            select(AttendancePunch)
            .where(AttendancePunch.attendance_day_id == attendance_day_id)
            .order_by(AttendancePunch.punch_time.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # Corrections
    # ------------------------------------------------------------------

    async def get_correction_by_id(
        self, correction_id: int
    ) -> Optional[AttendanceCorrection]:
        stmt = select(AttendanceCorrection).where(
            AttendanceCorrection.id == correction_id
        )
        return await self.scalar_one_or_none(stmt)

    async def get_correction_by_approval_id(
        self, approval_request_id: int
    ) -> Optional[AttendanceCorrection]:
        stmt = select(AttendanceCorrection).where(
            AttendanceCorrection.approval_request_id == approval_request_id
        )
        return await self.scalar_one_or_none(stmt)

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

    # ------------------------------------------------------------------
    # Policies (versioned; effective_to is exclusive end)
    # ------------------------------------------------------------------

    async def get_current_policy(
        self, *, as_of: Optional[date] = None
    ) -> Optional[AttendancePolicy]:
        as_of = as_of or date.today()
        # effective_to is exclusive: open row (NULL) or effective_to > as_of
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

    # ------------------------------------------------------------------
    # Monthly summaries
    # ------------------------------------------------------------------

    async def get_monthly_summary(
        self, employment_id: int, year: int, month: int
    ) -> Optional[MonthlyAttendanceSummary]:
        stmt = select(MonthlyAttendanceSummary).where(
            MonthlyAttendanceSummary.employment_id == employment_id,
            MonthlyAttendanceSummary.year == year,
            MonthlyAttendanceSummary.month == month,
        )
        return await self.scalar_one_or_none(stmt)

    # ------------------------------------------------------------------
    # Breaks
    # ------------------------------------------------------------------

    async def get_break_by_id(self, break_id: int) -> Optional[AttendanceBreak]:
        stmt = select(AttendanceBreak).where(AttendanceBreak.id == break_id)
        return await self.scalar_one_or_none(stmt)

    async def get_open_break(
        self, attendance_day_id: int
    ) -> Optional[AttendanceBreak]:
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
