"""Leave request repository."""
from __future__ import annotations

from collections.abc import Sequence
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import LeaveRequestStatus
from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeaveRequest

if TYPE_CHECKING:
    from app.modules.rbac.scoping.constraint import ScopeConstraint


class RequestRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_request_by_id(
        self,
        request_id: int,
        *,
        constraint: Optional["ScopeConstraint"] = None,
    ) -> LeaveRequest | None:
        """Fetch by id AND optional scope filter (never fetch-then-check)."""
        from app.modules.rbac.scoping.adapters import apply_scope

        stmt = select(LeaveRequest).where(LeaveRequest.id == request_id)
        if constraint is not None:
            stmt = apply_scope(stmt, constraint)
        return await self.scalar_one_or_none(stmt)

    async def get_request_by_approval_id(
        self, approval_request_id: int
    ) -> LeaveRequest | None:
        stmt = select(LeaveRequest).where(
            LeaveRequest.approval_request_id == approval_request_id
        )
        return await self.scalar_one_or_none(stmt)

    async def list_requests(
        self,
        *,
        employment_id: int | None = None,
        status: LeaveRequestStatus | None = None,
        limit: int = 100,
        offset: int = 0,
        constraint: Optional["ScopeConstraint"] = None,
    ) -> Sequence[LeaveRequest]:
        """List with optional ScopeConstraint applied BEFORE limit/offset."""
        from app.modules.rbac.scoping.adapters import apply_scope

        stmt = select(LeaveRequest).order_by(LeaveRequest.created_at.desc())
        if employment_id is not None:
            stmt = stmt.where(LeaveRequest.employment_id == employment_id)
        if status is not None:
            stmt = stmt.where(LeaveRequest.status == status)
        if constraint is not None:
            stmt = apply_scope(stmt, constraint)
        stmt = stmt.limit(limit).offset(offset)
        return await self.scalars(stmt)

    async def has_overlapping_request(
        self,
        employment_id: int,
        start_date: date,
        end_date: date,
        *,
        exclude_id: int | None = None,
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
