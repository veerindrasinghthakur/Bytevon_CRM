"""My Work Leave repository."""
from __future__ import annotations

from datetime import date
from typing import List, Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeaveRequest as LeaveModel, LeaveType as LeaveTypeModel, LeaveBalance as LeaveBalanceModel


class MyWorkLeaveRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_requests(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20, offset: int = 0
    ) -> Sequence[LeaveModel]:
        stmt = select(LeaveModel).where(LeaveModel.employment_id == employment_id)
        if status:
            stmt = stmt.where(LeaveModel.status == status)
        if search:
            stmt = stmt.where(
                LeaveModel.reason.ilike(f"%{search}%") |
                LeaveModel.type.ilike(f"%{search}%")
            )
        stmt = stmt.order_by(LeaveModel.applied_on.desc()).limit(limit).offset(offset)
        return await self.scalars(stmt)

    async def count_my_requests(
        self, employment_id: int, status: Optional[str] = None, search: Optional[str] = None
    ) -> int:
        stmt = select(LeaveModel).where(LeaveModel.employment_id == employment_id)
        if status:
            stmt = stmt.where(LeaveModel.status == status)
        if search:
            stmt = stmt.where(
                LeaveModel.reason.ilike(f"%{search}%") |
                LeaveModel.type.ilike(f"%{search}%")
            )
        result = await self.conn.execute(select(func.count()).select_from(stmt.subquery()))
        return result.scalar() or 0

    async def get_balances(self, employment_id: int) -> Sequence[LeaveBalanceModel]:
        stmt = select(LeaveBalanceModel).where(LeaveBalanceModel.employment_id == employment_id)
        return await self.scalars(stmt)

    async def get_types(self) -> Sequence[LeaveTypeModel]:
        stmt = select(LeaveTypeModel).where(LeaveTypeModel.is_active.is_(True))
        return await self.scalars(stmt)