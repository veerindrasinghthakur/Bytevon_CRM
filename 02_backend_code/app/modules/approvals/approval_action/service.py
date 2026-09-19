"""ApprovalActionService — approve / reject / cancel / comment + decision events."""
from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ApprovalActionType, ApprovalStatus
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.approvals.approval_action.repository import ApprovalActionRepository
from app.modules.approvals.approval_action.schemas import (
    ApprovalActionRequest,
    ApprovalActionResponse,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
    CommentRequest,
)
from app.modules.approvals.models import ApprovalAction

logger = logging.getLogger(__name__)

ApprovalDecisionEvent = dict
_decision_handlers: list[Callable[[ApprovalDecisionEvent], Awaitable[None]]] = []


def register_approval_decision_handler(
    handler: Callable[[ApprovalDecisionEvent], Awaitable[None]],
) -> None:
    """Consumers call this once at app startup to receive post-commit decisions."""
    _decision_handlers.append(handler)


class ApprovalActionService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ApprovalActionRepository(session)

    async def get_request(self, request_id: int) -> ApprovalRequestDetailResponse:
        """Read-only fetch for ownership checks (no state change)."""
        req = await self._repo.get_request_by_id(request_id, with_actions=True)
        if req is None:
            raise NotFoundError("Approval request not found")
        actions = await self._repo.list_actions(req.id)
        return ApprovalRequestDetailResponse(
            **ApprovalRequestResponse.model_validate(req).model_dump(),
            actions=[ApprovalActionResponse.model_validate(a) for a in actions],
        )

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
        remarks: str | None,
        actor_employment_id: int,
        allow_requester: bool = False,
    ) -> ApprovalRequestDetailResponse:
        req = await self._repo.get_request_by_id(request_id, with_actions=True)
        if req is None:
            raise NotFoundError("Approval request not found")
        if req.status != ApprovalStatus.PENDING:
            raise DomainError(f"Request is already {req.status.value}")

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
        # Status mutation issues an UPDATE on commit, postfetch-expiring
        # server-computed columns; refresh before sync validation.
        await self._refresh(req)
        await self._audit(
            f"approval_request.{new_status.value.lower()}",
            req.id,
            actor_employment_id,
        )

        event: ApprovalDecisionEvent = {
            "request_id": req.id,
            "request_type": req.request_type,
            "reference_id": req.reference_id,
            "status": new_status.value,
            "actor_employment_id": actor_employment_id,
        }
        await self._emit_decision_event(event)

        actions = await self._repo.list_actions(req.id)
        return ApprovalRequestDetailResponse(
            **ApprovalRequestResponse.model_validate(req).model_dump(),
            actions=[ApprovalActionResponse.model_validate(a) for a in actions],
        )

    async def _emit_decision_event(self, event: ApprovalDecisionEvent) -> None:
        for handler in _decision_handlers:
            try:
                await handler(event)
            except Exception:
                logger.exception(
                    "Approval decision handler failed for request_id=%s",
                    event.get("request_id"),
                )
