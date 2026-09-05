"""
LeaveRepository — domain-specific queries only.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional, Sequence

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeaveRequestStatus, LeaveType
from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeaveLedger, LeavePolicy, LeaveRequest


class LeaveRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Policies
    # ------------------------------------------------------------------

    async def get_policy_by_id(self, policy_id: int) -> Optional[LeavePolicy]:
        stmt = select(LeavePolicy).where(LeavePolicy.id == policy_id)
        return await self.scalar_one_or_none(stmt)

    async def get_current_policy(
        self, leave_type: LeaveType, *, as_of: Optional[date] = None
    ) -> Optional[LeavePolicy]:
        as_of = as_of or date.today()
        stmt = (
            select(LeavePolicy)
            .where(
                LeavePolicy.leave_type == leave_type,
                LeavePolicy.effective_from <= as_of,
                (LeavePolicy.effective_to.is_(None))
                | (LeavePolicy.effective_to >= as_of),
            )
            .order_by(LeavePolicy.effective_from.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_policies(
        self, *, leave_type: Optional[LeaveType] = None
    ) -> Sequence[LeavePolicy]:
        stmt = select(LeavePolicy).order_by(
            LeavePolicy.leave_type, LeavePolicy.effective_from.desc()
        )
        if leave_type is not None:
            stmt = stmt.where(LeavePolicy.leave_type == leave_type)
        return await self.scalars(stmt)

    async def close_policy(self, policy_id: int, effective_to: date) -> None:
        stmt = (
            update(LeavePolicy)
            .where(LeavePolicy.id == policy_id)
            .values(effective_to=effective_to)
        )
        await self.execute(stmt)

    # ------------------------------------------------------------------
    # Requests
    # ------------------------------------------------------------------

    async def get_request_by_id(
        self, request_id: int
    ) -> Optional[LeaveRequest]:
        stmt = select(LeaveRequest).where(LeaveRequest.id == request_id)
        return await self.scalar_one_or_none(stmt)

    async def get_request_by_approval_id(
        self, approval_request_id: int
    ) -> Optional[LeaveRequest]:
        stmt = select(LeaveRequest).where(
            LeaveRequest.approval_request_id == approval_request_id
        )
        return await self.scalar_one_or_none(stmt)

    async def list_requests(
        self,
        *,
        employment_id: Optional[int] = None,
        status: Optional[LeaveRequestStatus] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[LeaveRequest]:
        stmt = select(LeaveRequest).order_by(LeaveRequest.created_at.desc())
        if employment_id is not None:
            stmt = stmt.where(LeaveRequest.employment_id == employment_id)
        if status is not None:
            stmt = stmt.where(LeaveRequest.status == status)
        stmt = stmt.limit(limit).offset(offset)
        return await self.scalars(stmt)

    async def has_overlapping_request(
        self,
        employment_id: int,
        start_date: date,
        end_date: date,
        *,
        exclude_id: Optional[int] = None,
    ) -> bool:
        stmt = select(LeaveRequest.id).where(
            LeaveRequest.employment_id == employment_id,
            LeaveRequest.status.in_(
                [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED]
            ),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        if exclude_id is not None:
            stmt = stmt.where(LeaveRequest.id != exclude_id)
        stmt = stmt.limit(1)
        return await self.scalar_one_or_none(stmt) is not None

    # ------------------------------------------------------------------
    # Ledger
    # ------------------------------------------------------------------

    async def list_ledger(
        self,
        employment_id: int,
        *,
        leave_type: Optional[LeaveType] = None,
        limit: int = 200,
    ) -> Sequence[LeaveLedger]:
        stmt = (
            select(LeaveLedger)
            .where(LeaveLedger.employment_id == employment_id)
            .order_by(LeaveLedger.created_at.desc())
            .limit(limit)
        )
        if leave_type is not None:
            stmt = stmt.where(LeaveLedger.leave_type == leave_type)
        return await self.scalars(stmt)

    async def sum_balance(
        self, employment_id: int, leave_type: LeaveType
    ) -> Decimal:
        stmt = select(func.coalesce(func.sum(LeaveLedger.days), 0)).where(
            LeaveLedger.employment_id == employment_id,
            LeaveLedger.leave_type == leave_type,
        )
        result = await self.execute(stmt)
        value = result.scalar()
        return Decimal(str(value or 0))

    async def sum_balances_by_type(
        self, employment_id: int
    ) -> Sequence[tuple]:
        stmt = (
            select(LeaveLedger.leave_type, func.coalesce(func.sum(LeaveLedger.days), 0))
            .where(LeaveLedger.employment_id == employment_id)
            .group_by(LeaveLedger.leave_type)
        )
        result = await self.execute(stmt)
        return result.all()
