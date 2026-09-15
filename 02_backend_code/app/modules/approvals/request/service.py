"""RequestService — create / list / get approval requests."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ApprovalStatus
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.models import ApprovalRequest
from app.modules.approvals.request.repository import RequestRepository
from app.modules.approvals.request.schemas import (
    ApprovalActionResponse,
    ApprovalRequestCreate,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
)


class RequestService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = RequestRepository(session)

    async def create_request(
        self,
        data: ApprovalRequestCreate,
        *,
        actor_employment_id: Optional[int] = None,
        commit: bool = True,
    ) -> ApprovalRequestResponse:
        if data.target.value == "DEPARTMENT" and data.target_department_id is None:
            raise DomainError(
                "target_department_id is required when target is DEPARTMENT"
            )

        existing = await self._repo.get_request_by_reference(
            data.request_type, data.reference_id
        )
        if existing and existing.status == ApprovalStatus.PENDING:
            raise ConflictError(
                f"A pending approval already exists for {data.request_type}#{data.reference_id}"
            )

        req = ApprovalRequest(
            request_type=data.request_type,
            reference_id=data.reference_id,
            requester_employment_id=data.requester_employment_id,
            target=data.target,
            target_department_id=data.target_department_id,
            status=ApprovalStatus.PENDING,
        )
        await self._repo.add(req)

        if commit:
            await self._commit()
            await self._audit("approval_request.created", req.id, actor_employment_id)
        else:
            await self._flush()

        return ApprovalRequestResponse.model_validate(req)

    async def get_request(self, request_id: int) -> ApprovalRequestDetailResponse:
        req = await self._repo.get_request_by_id(request_id, with_actions=True)
        if req is None:
            raise NotFoundError("Approval request not found")
        return ApprovalRequestDetailResponse(
            **ApprovalRequestResponse.model_validate(req).model_dump(),
            actions=[
                ApprovalActionResponse.model_validate(a) for a in req.actions
            ],
        )

    async def get_request_by_reference(
        self, request_type: str, reference_id: int
    ) -> ApprovalRequestDetailResponse:
        req = await self._repo.get_request_by_reference(request_type, reference_id)
        if req is None:
            raise NotFoundError("Approval request not found")
        return await self.get_request(req.id)

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
        rows = await self._repo.list_requests(
            status=status,
            request_type=request_type,
            requester_employment_id=requester_employment_id,
            target_department_id=target_department_id,
            limit=limit,
            offset=offset,
        )
        return [ApprovalRequestResponse.model_validate(r) for r in rows]
