"""Approval action routes — approve / reject / cancel / comment."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.modules.approvals.approval_action.schemas import (
    ApprovalActionRequest,
    ApprovalActionResponse,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
    CommentRequest,
)
from app.modules.approvals.dependencies import ApprovalActionServiceDep

router = APIRouter(prefix="/approvals", tags=["Approvals — Actions"])

_TYPE_ICON = {
    "LEAVE": "event_busy",
    "ATTENDANCE": "schedule",
    "ATTENDANCE_CORRECTION": "edit_calendar",
    "EXPENSE": "payments",
    "PAYROLL": "account_balance_wallet",
}
_TYPE_COLOR = {
    "LEAVE": "secondary",
    "ATTENDANCE": "tertiary",
    "ATTENDANCE_CORRECTION": "tertiary",
    "EXPENSE": "primary",
    "PAYROLL": "primary",
}


def _ui_row(r: ApprovalRequestResponse) -> dict[str, Any]:
    rt = (r.request_type or "").upper()
    base = rt.split("_")[0] if rt else "REQUEST"
    status_val = r.status.value if hasattr(r.status, "value") else str(r.status)
    created = r.created_at.isoformat() if isinstance(r.created_at, datetime) else str(r.created_at)
    return {
        "id": str(r.id),
        "type": r.request_type,
        "typeIcon": _TYPE_ICON.get(rt, _TYPE_ICON.get(base, "approval")),
        "typeColor": _TYPE_COLOR.get(rt, _TYPE_COLOR.get(base, "secondary")),
        "requester": f"Emp #{r.requester_employment_id}",
        "requesterInitials": "E",
        "date": created[:10] if created else "",
        "priority": "Normal",
        "status": status_val,
        "stage": status_val,
        "request_type": r.request_type,
        "reference_id": r.reference_id,
        "requester_employment_id": r.requester_employment_id,
        "created_at": created,
    }


@router.post("/{request_id}/approve")
async def approve_ui(
    request_id: int,
    service: ApprovalActionServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "APPROVE", "DEPARTMENT"))],
    body: ApprovalActionRequest | None = None,
) -> dict[str, Any]:
    data = body or ApprovalActionRequest()
    detail = await service.approve(request_id, data, actor_employment_id=auth.employment_id)
    return _ui_row(detail)


@router.post("/{request_id}/reject")
async def reject_ui(
    request_id: int,
    service: ApprovalActionServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "APPROVE", "DEPARTMENT"))],
    body: ApprovalActionRequest | None = None,
) -> dict[str, Any]:
    data = body or ApprovalActionRequest()
    detail = await service.reject(request_id, data, actor_employment_id=auth.employment_id)
    return _ui_row(detail)


@router.post(
    "/requests/{request_id}/approve",
    response_model=ApprovalRequestDetailResponse,
)
async def approve(
    request_id: int,
    body: ApprovalActionRequest,
    service: ApprovalActionServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "APPROVE", "DEPARTMENT"))],
) -> ApprovalRequestDetailResponse:
    return await service.approve(request_id, body, actor_employment_id=auth.employment_id)


@router.post(
    "/requests/{request_id}/reject",
    response_model=ApprovalRequestDetailResponse,
)
async def reject(
    request_id: int,
    body: ApprovalActionRequest,
    service: ApprovalActionServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "APPROVE", "DEPARTMENT"))],
) -> ApprovalRequestDetailResponse:
    return await service.reject(request_id, body, actor_employment_id=auth.employment_id)


@router.post(
    "/requests/{request_id}/cancel",
    response_model=ApprovalRequestDetailResponse,
)
async def cancel(
    request_id: int,
    body: ApprovalActionRequest,
    service: ApprovalActionServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "UPDATE", "SELF", union=True))],
) -> ApprovalRequestDetailResponse:
    current = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "approval", "UPDATE", owner_employment_id=current.requester_employment_id)
    return await service.cancel(request_id, body, actor_employment_id=auth.employment_id)


@router.post(
    "/requests/{request_id}/comment",
    response_model=ApprovalActionResponse,
    status_code=201,
)
async def comment(
    request_id: int,
    body: CommentRequest,
    service: ApprovalActionServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "UPDATE", "SELF", union=True))],
) -> ApprovalActionResponse:
    current = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "approval", "UPDATE", owner_employment_id=current.requester_employment_id)
    return await service.comment(request_id, body, actor_employment_id=auth.employment_id)
