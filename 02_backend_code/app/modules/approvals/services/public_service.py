"""
ApprovalPublicService — only public entry point for Approvals.

Locked rules:
- Writes ONLY approval_requests + approval_actions.
- Never imports Leave / Attendance / other consumers.
- After approve/reject commit → emit domain event for consumers to handle
  in their own TX (local status projection + ledger recalc).

Event emission is currently an in-process callback registry so consumers
can register handlers without creating circular imports. Replace with a
proper outbox / message bus later if needed.
"""

from __future__ import annotations

import logging
from typing import Awaitable, Callable, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import ApprovalActionType, ApprovalStatus
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.models import ApprovalAction, ApprovalRequest
from app.modules.approvals.repositories.repository import ApprovalRepository
from app.modules.approvals.schemas.schemas import (
    ApprovalActionRequest,
    ApprovalActionResponse,
    ApprovalRequestCreate,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
    CommentRequest,
    MessageResponse,
)

logger = logging.getLogger(__name__)

# Domain event payload after status change
ApprovalDecisionEvent = dict  # keys: request_id, request_type, reference_id, status, actor_employment_id

# Simple in-process registry (module-level; consumers register at startup)
_decision_handlers: list[Callable[[ApprovalDecisionEvent], Awaitable[None]]] = []


def register_approval_decision_handler(
    handler: Callable[[ApprovalDecisionEvent], Awaitable[None]],
) -> None:
    """Consumers call this once at app startup to receive post-commit decisions."""
    _decision_handlers.append(handler)


class ApprovalPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ApprovalRepository(session)

    # ==================================================================
    # Submit path (called by consumers inside their own TX or after)
    # ==================================================================

    async def create_request(
        self,
        data: ApprovalRequestCreate,
        *,
        actor_employment_id: Optional[int] = None,
        commit: bool = True,
    ) -> ApprovalRequestResponse:
        """
        Create a pending approval request.

        When called from a consumer that already owns a TX, pass commit=False
        so the consumer commits the combined work. When called standalone, commit=True.
        """
        if data.target.value == "DEPARTMENT" and data.target_department_id is None:
            raise DomainError("target_department_id is required when target is DEPARTMENT")

        # Optional: prevent duplicate open requests for same reference
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

    # ==================================================================
    # Decision path (owned by Approval)
    # ==================================================================

    async def approve(
        self,
        request_id: int,
        data: ApprovalActionRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalRequestDetailResponse:
        return await self._decide(
            request_id,
            action=ApprovalActionType.APPROVED,
            new_status=ApprovalStatus.APPROVED,
            remarks=data.remarks,
            actor_employment_id=actor_employment_id,
        )

    async def reject(
        self,
        request_id: int,
        data: ApprovalActionRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalRequestDetailResponse:
        return await self._decide(
            request_id,
            action=ApprovalActionType.REJECTED,
            new_status=ApprovalStatus.REJECTED,
            remarks=data.remarks,
            actor_employment_id=actor_employment_id,
        )

    async def cancel(
        self,
        request_id: int,
        data: ApprovalActionRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalRequestDetailResponse:
        """
        Cancel is typically done by the requester or system.
        Treated as a terminal status with a REJECTED-style action log entry
        using COMMENTED or we map to CANCELLED status + COMMENTED action.
        """
        return await self._decide(
            request_id,
            action=ApprovalActionType.COMMENTED,
            new_status=ApprovalStatus.CANCELLED,
            remarks=data.remarks or "Cancelled",
            actor_employment_id=actor_employment_id,
            allow_requester=True,
        )

    async def comment(
        self,
        request_id: int,
        data: CommentRequest,
        *,
        actor_employment_id: int,
    ) -> ApprovalActionResponse:
        req = await self._repo.get_request_by_id(request_id)
        if req is None:
            raise NotFoundError("Approval request not found")
        if req.status != ApprovalStatus.PENDING:
            raise DomainError("Can only comment on pending requests")

        action = ApprovalAction(
            approval_request_id=req.id,
            employment_id=actor_employment_id,
            action=ApprovalActionType.COMMENTED,
            remarks=data.remarks,
        )
        await self._repo.add(action)
        await self._commit()
        await self._audit("approval_request.commented", req.id, actor_employment_id)
        return ApprovalActionResponse.model_validate(action)

    async def _decide(
        self,
        request_id: int,
        *,
        action: ApprovalActionType,
        new_status: ApprovalStatus,
        remarks: Optional[str],
        actor_employment_id: int,
        allow_requester: bool = False,
    ) -> ApprovalRequestDetailResponse:
        req = await self._repo.get_request_by_id(request_id, with_actions=True)
        if req is None:
            raise NotFoundError("Approval request not found")
        if req.status != ApprovalStatus.PENDING:
            raise DomainError(f"Request is already {req.status.value}")

        # Basic actor guard: requester cannot approve/reject their own request
        if (
            not allow_requester
            and req.requester_employment_id == actor_employment_id
            and action in (ApprovalActionType.APPROVED, ApprovalActionType.REJECTED)
        ):
            raise DomainError("Requester cannot approve or reject their own request")

        action_row = ApprovalAction(
            approval_request_id=req.id,
            employment_id=actor_employment_id,
            action=action,
            remarks=remarks,
        )
        await self._repo.add(action_row)
        req.status = new_status

        await self._commit()
        await self._audit(
            f"approval_request.{new_status.value.lower()}",
            req.id,
            actor_employment_id,
        )

        # After-commit domain event for consumers
        event: ApprovalDecisionEvent = {
            "request_id": req.id,
            "request_type": req.request_type,
            "reference_id": req.reference_id,
            "status": new_status.value,
            "actor_employment_id": actor_employment_id,
        }
        await self._emit_decision_event(event)

        # Reload actions for response
        actions = await self._repo.list_actions(req.id)
        return ApprovalRequestDetailResponse(
            **ApprovalRequestResponse.model_validate(req).model_dump(),
            actions=[ApprovalActionResponse.model_validate(a) for a in actions],
        )

    # ==================================================================
    # Queries
    # ==================================================================

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

    # ==================================================================
    # Event emission + audit
    # ==================================================================

    async def _emit_decision_event(self, event: ApprovalDecisionEvent) -> None:
        for handler in _decision_handlers:
            try:
                await handler(event)
            except Exception:
                logger.exception(
                    "Approval decision handler failed for request_id=%s",
                    event.get("request_id"),
                )

