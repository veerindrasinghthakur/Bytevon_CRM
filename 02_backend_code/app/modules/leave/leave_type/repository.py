"""Leave type master repository."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeaveLedger, LeavePolicy, LeaveRequest, LeaveType


class LeaveTypeRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(self, type_id: int) -> LeaveType | None:
        stmt = select(LeaveType).where(LeaveType.id == type_id)
        return await self.scalar_one_or_none(stmt)

    async def get_by_code(self, code: str) -> LeaveType | None:
        stmt = select(LeaveType).where(LeaveType.code == code.strip().upper())
        return await self.scalar_one_or_none(stmt)

    async def get_active_by_code(self, code: str) -> LeaveType | None:
        """Live catalog row: not soft-deleted and active."""
        stmt = (
            select(LeaveType)
            .where(
                LeaveType.code == code.strip().upper(),
                LeaveType.deleted_at.is_(None),
                LeaveType.is_active.is_(True),
            )
        )
        return await self.scalar_one_or_none(stmt)

    async def list_types(
        self, *, include_archived: bool = False
    ) -> Sequence[LeaveType]:
        stmt = select(LeaveType).order_by(LeaveType.sort_order, LeaveType.code)
        if not include_archived:
            stmt = stmt.where(LeaveType.deleted_at.is_(None))
        return await self.scalars(stmt)

    async def code_map_for(self, type_ids: set[int]) -> dict[int, str]:
        if not type_ids:
            return {}
        stmt = select(LeaveType.id, LeaveType.code).where(
            LeaveType.id.in_(sorted(type_ids))
        )
        result = await self.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def count_references(self, type_id: int) -> int:
        """How many policy/request/ledger rows reference this type."""
        total = 0
        for model in (LeavePolicy, LeaveRequest, LeaveLedger):
            stmt = select(func.count()).where(model.leave_type_id == type_id)
            result = await self.execute(stmt)
            total += int(result.scalar() or 0)
        return total
