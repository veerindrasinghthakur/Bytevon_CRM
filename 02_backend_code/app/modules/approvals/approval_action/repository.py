"""Approval action repository — reuses request queries for decide path."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repositories.base_repository import BaseRepository
from app.modules.approvals.models import ApprovalAction, ApprovalRequest


class ApprovalActionRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_request_by_id(
        self, request_id: int, *, with_actions: bool = False
    ) -> ApprovalRequest | None:
        stmt = select(ApprovalRequest).where(ApprovalRequest.id == request_id)
        if with_actions:
            stmt = stmt.options(selectinload(ApprovalRequest.actions))
        return await self.scalar_one_or_none(stmt)

    async def list_actions(
        self, approval_request_id: int
    ) -> Sequence[ApprovalAction]:
        stmt = (
            select(ApprovalAction)
            .where(ApprovalAction.approval_request_id == approval_request_id)
            .order_by(ApprovalAction.created_at)
        )
        return await self.scalars(stmt)
