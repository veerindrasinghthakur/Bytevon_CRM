"""My Work Approvals Service."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.approvals.repository import MyWorkApprovalsRepository
from app.modules.my_work.approvals.schemas import ApprovalListResponse


class MyWorkApprovalsService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkApprovalsRepository(session)

    async def list_my_approvals(
        self,
        employment_id: Optional[int] = None,
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
    ) -> ApprovalListResponse:
        return ApprovalListResponse(items=[], total=0, page=1, pageSize=max(1, limit))
