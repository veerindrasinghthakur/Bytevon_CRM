"""Shim — ApprovalPublicService facade for consumers + lifespan handlers."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.approvals.approval_action.service import (
    ApprovalActionService,
    register_approval_decision_handler,
)
from app.modules.approvals.approval_action.schemas import (
    ApprovalActionRequest,
    ApprovalActionResponse,
    ApprovalRequestDetailResponse,
    CommentRequest,
)
from app.modules.approvals.request.schemas import (
    ApprovalRequestCreate,
    ApprovalRequestResponse,
)
from app.modules.approvals.request.service import RequestService
from app.core.db.enums import ApprovalStatus

__all__ = [
    "ApprovalPublicService",
    "register_approval_decision_handler",
]


class ApprovalPublicService:
    """Facade combining RequestService + ApprovalActionService for consumers."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._requests = RequestService(session)
        self._actions = ApprovalActionService(session)

    async def create_request(
        self,
        data: ApprovalRequestCreate,
        *,
        actor_employment_id: Optional[int] = None,
        commit: bool = True,
    ) -> ApprovalRequestResponse:
        return await self._requests.create_request(
            data, actor_employment_id=actor_employment_id, commit=commit
        )

    async def approve(
        self,
        request_id: int,
        data: ApprovalActionRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalRequestDetailResponse:
        return await self._actions.approve(
            request_id, data, actor_employment_id=actor_employment_id
        )

    async def reject(
        self,
        request_id: int,
        data: ApprovalActionRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalRequestDetailResponse:
        return await self._actions.reject(
            request_id, data, actor_employment_id=actor_employment_id
        )

    async def cancel(
        self,
        request_id: int,
        data: ApprovalActionRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalRequestDetailResponse:
        return await self._actions.cancel(
            request_id, data, actor_employment_id=actor_employment_id
        )

    async def comment(
        self,
        request_id: int,
        data: CommentRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalActionResponse:
        return await self._actions.comment(
            request_id, data, actor_employment_id=actor_employment_id
        )

    async def get_request(self, request_id: int) -> ApprovalRequestDetailResponse:
        return await self._requests.get_request(request_id)

    async def get_request_by_reference(
        self, request_type: str, reference_id: int
    ) -> ApprovalRequestDetailResponse:
        return await self._requests.get_request_by_reference(
            request_type, reference_id
        )

    async def list_requests(
        self,
        *,
        status: Optional[ApprovalStatus] = None,
        request_type: Optional[str] = None,
        requester_employment_id: Optional[int] = None,
        target_department_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ApprovalRequestResponse]:
        return await self._requests.list_requests(
            status=status,
            request_type=request_type,
            requester_employment_id=requester_employment_id,
            target_department_id=target_department_id,
            limit=limit,
            offset=offset,
        )
