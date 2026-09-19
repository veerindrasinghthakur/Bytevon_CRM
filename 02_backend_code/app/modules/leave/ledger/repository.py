"""Leave ledger repository."""
from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeaveType
from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeaveLedger


class LedgerRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_ledger(
        self,
        employment_id: int,
        *,
        leave_type: LeaveType | None = None,
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
    ) -> Sequence[Any]:
        stmt = (
            select(LeaveLedger.leave_type, func.coalesce(func.sum(LeaveLedger.days), 0))
            .where(LeaveLedger.employment_id == employment_id)
            .group_by(LeaveLedger.leave_type)
        )
        result = await self.execute(stmt)
        return result.all()
