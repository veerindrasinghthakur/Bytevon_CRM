"""My Work Approvals Service."""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.approvals.repository import MyWorkApprovalsRepository
from app.modules.my_work.approvals.schemas import ApprovalListResponse, ApprovalRequest


class MyWorkApprovalsService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkApprovalsRepository(session)

    async def list_my_approvals(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20
    ) -> ApprovalListResponse:
        items = await self._repo.list_my_approvals(
            employment_id, status=status, search=search, limit=limit
        )
        total = await self._repo.count_my_approvals(employment_id, status=status, search=search)
        return ApprovalListResponse(
            items=items,
            total=total,
            page=1,
            pageSize=limit,
        )