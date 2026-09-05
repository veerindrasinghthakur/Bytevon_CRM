"""
ApprovalRepository — domain-specific queries only.
"""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db.enums import ApprovalStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.approvals.models import ApprovalAction, ApprovalRequest


class ApprovalRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_request_by_id(
        self, request_id: int, *, with_actions: bool = False
    ) -> Optional[ApprovalRequest]:
        stmt = select(ApprovalRequest).where(ApprovalRequest.id == request_id)
        if with_actions:
            stmt = stmt.options(selectinload(ApprovalRequest.actions))
        return await self.scalar_one_or_none(stmt)

    async def get_request_by_reference(
        self, request_type: str, reference_id: int
    ) -> Optional[ApprovalRequest]:
        stmt = (
            select(ApprovalRequest)
            .where(
                ApprovalRequest.request_type == request_type,
                ApprovalRequest.reference_id == reference_id,
            )
            .order_by(ApprovalRequest.id.desc())
            .limit(1)
        )
        return await self.scalar_one_or_none(stmt)

    async def list_requests(
        self,
        *,
        status: Optional[ApprovalStatus] = None,
        request_type: Optional[str] = None,
        requester_employment_id: Optional[int] = None,
        target_department_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[ApprovalRequest]:
        stmt = select(ApprovalRequest).order_by(ApprovalRequest.created_at.desc())
        if status is not None:
            stmt = stmt.where(ApprovalRequest.status == status)
        if request_type is not None:
            stmt = stmt.where(ApprovalRequest.request_type == request_type)
        if requester_employment_id is not None:
            stmt = stmt.where(
                ApprovalRequest.requester_employment_id == requester_employment_id
            )
        if target_department_id is not None:
            stmt = stmt.where(
                ApprovalRequest.target_department_id == target_department_id
            )
        stmt = stmt.limit(limit).offset(offset)
        return await self.scalars(stmt)

    async def list_actions(
        self, approval_request_id: int
    ) -> Sequence[ApprovalAction]:
        stmt = (
            select(ApprovalAction)
            .where(ApprovalAction.approval_request_id == approval_request_id)
            .order_by(ApprovalAction.created_at)
        )
        return await self.scalars(stmt)
