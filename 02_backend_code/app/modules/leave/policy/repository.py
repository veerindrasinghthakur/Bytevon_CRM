"""Leave policy repository."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeaveType
from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeavePolicy


class PolicyRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_policy_by_id(self, policy_id: int) -> LeavePolicy | None:
        stmt = select(LeavePolicy).where(LeavePolicy.id == policy_id)
        return await self.scalar_one_or_none(stmt)

    async def get_current_policy(
        self, leave_type: LeaveType, *, as_of: date | None = None
    ) -> LeavePolicy | None:
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
        self, *, leave_type: LeaveType | None = None
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
