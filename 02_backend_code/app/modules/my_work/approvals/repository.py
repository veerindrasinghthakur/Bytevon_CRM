"""My Work Approvals repository."""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional, Sequence
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.approval.models import ApprovalRequest


class MyWorkApprovalsRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_approvals(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20
    ) -> Sequence[ApprovalRequest]:
        stmt = select(ApprovalRequest).where(ApprovalRequest.approver_employment_id == employment_id)
        if status:
            stmt = stmt.where(ApprovalRequest.status == status)
        if search:
            stmt = stmt.where(
                ApprovalRequest.request_reason.ilike(f"%{search}%") |
                ApprovalRequest.request_type.ilike(f"%{search}%")
            )
        stmt = stmt.order_by(ApprovalRequest.submitted_on.desc()).limit(limit)
        return await self.scalars(stmt)

    async def count_my_approvals(
        self, employment_id: int, status: Optional[str] = None, search: Optional[str] = None
    ) -> int:
        stmt = select(ApprovalRequest).where(ApprovalRequest.approver_employment_id == employment_id)
        if status:
            stmt = stmt.where(ApprovalRequest.status == status)
        if search:
            stmt = stmt.where(
                ApprovalRequest.request_reason.ilike(f"%{search}%") |
                ApprovalRequest.request_type.ilike(f"%{search}%")
            )
        result = await self.conn.execute(select(func.count()).select_from(stmt.subquery()))
        return result.scalar() or 0