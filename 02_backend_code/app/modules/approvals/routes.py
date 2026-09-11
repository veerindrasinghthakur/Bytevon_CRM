"""
Approvals HTTP routes.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import ApprovalStatus
from app.modules.approvals.dependencies import ApprovalServiceDep
from app.modules.approvals.schemas.schemas import (
    ApprovalActionRequest,
    ApprovalActionResponse,
    ApprovalRequestCreate,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
    CommentRequest,
)

router = APIRouter(prefix="/approvals", tags=["Approvals"])

ActorHeader = Annotated[int, Header(alias="X-Employment-Id")]

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
    """Map domain response → frontend ApprovalRow shape."""
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


# ---------------------------------------------------------------------------
# Frontend convenience routes (must stay above /requests/{id} where possible)
# ---------------------------------------------------------------------------


@router.get("/kpis")
async def approval_kpis(service: ApprovalServiceDep) -> dict[str, int]:
    pending = await service.list_requests(status=ApprovalStatus.PENDING, limit=500)
    approved = await service.list_requests(status=ApprovalStatus.APPROVED, limit=500)
    rejected = await service.list_requests(status=ApprovalStatus.REJECTED, limit=500)
    today = date.today().isoformat()

    def _created_today(rows: list[ApprovalRequestResponse]) -> int:
        n = 0
        for r in rows:
            ts = r.created_at
            if isinstance(ts, datetime):
                if ts.date().isoformat() == today:
                    n += 1
            elif str(ts)[:10] == today:
                n += 1
        return n

    return {
        "total": len(pending) + len(approved) + len(rejected),
        "pending": len(pending),
        "approvedToday": _created_today(approved),
        "rejectedToday": _created_today(rejected),
        "overdue": 0,
    }


@router.get("/pending")
async def list_pending(
    service: ApprovalServiceDep,
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    rows = await service.list_requests(status=ApprovalStatus.PENDING, limit=limit)
    out = [_ui_row(r) for r in rows]
    if type and type not in ("All", ""):
        t = type.lower()
        out = [x for x in out if t in (x.get("type") or "").lower()]
    if search:
        q = search.lower()
        out = [
            x
            for x in out
            if q in (x.get("id") or "").lower()
            or q in (x.get("requester") or "").lower()
            or q in (x.get("type") or "").lower()
        ]
    return out


@router.get("/my-requests")
async def list_my_requests(
    service: ApprovalServiceDep,
    actor: Optional[int] = Header(None, alias="X-Employment-Id"),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    st: Optional[ApprovalStatus] = None
    if status_filter and status_filter not in ("All", ""):
        try:
            st = ApprovalStatus(status_filter.upper())
        except ValueError:
            st = None
    rows = await service.list_requests(
        status=st,
        requester_employment_id=actor,
        limit=limit,
    )
    out = [_ui_row(r) for r in rows]
    if search:
        q = search.lower()
        out = [
            x
            for x in out
            if q in (x.get("id") or "").lower()
            or q in (x.get("type") or "").lower()
            or q in (x.get("stage") or "").lower()
        ]
    return out


@router.get("/approvers")
async def list_approvers() -> list[dict[str, str]]:
    """Stub options until workforce lookup is wired."""
    return [
        {"value": "1", "label": "Manager (Emp #1)"},
        {"value": "2", "label": "HR (Emp #2)"},
    ]


@router.get("/{request_id}")
async def get_request_ui(
    request_id: int,
    service: ApprovalServiceDep,
) -> dict[str, Any]:
    detail = await service.get_request(request_id)
    row = _ui_row(detail)
    row["actions"] = [
        a.model_dump(mode="json") if hasattr(a, "model_dump") else a
        for a in (detail.actions or [])
    ]
    return row


@router.post("/{request_id}/approve")
async def approve_ui(
    request_id: int,
    service: ApprovalServiceDep,
    actor: ActorHeader,
    body: Optional[ApprovalActionRequest] = None,
) -> dict[str, Any]:
    data = body or ApprovalActionRequest()
    # Frontend may send { comment } — accept via remarks alias already on schema
    detail = await service.approve(request_id, data, actor_employment_id=actor)
    return _ui_row(detail)


@router.post("/{request_id}/reject")
async def reject_ui(
    request_id: int,
    service: ApprovalServiceDep,
    actor: ActorHeader,
    body: Optional[ApprovalActionRequest] = None,
) -> dict[str, Any]:
    data = body or ApprovalActionRequest()
    detail = await service.reject(request_id, data, actor_employment_id=actor)
    return _ui_row(detail)


# ---------------------------------------------------------------------------
# Canonical domain routes
# ---------------------------------------------------------------------------


@router.post(
    "/requests",
    response_model=ApprovalRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create approval request (also callable by consumer services)",
)
async def create_request(
    body: ApprovalRequestCreate,
    service: ApprovalServiceDep,
    actor: Optional[int] = Header(None, alias="X-Employment-Id"),
) -> ApprovalRequestResponse:
    return await service.create_request(body, actor_employment_id=actor)


@router.get("/requests", response_model=list[ApprovalRequestResponse])
async def list_requests(
    service: ApprovalServiceDep,
    status_filter: Optional[ApprovalStatus] = Query(None, alias="status"),
    request_type: Optional[str] = Query(None),
    requester_employment_id: Optional[int] = Query(None),
    target_department_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ApprovalRequestResponse]:
    return await service.list_requests(
        status=status_filter,
        request_type=request_type,
        requester_employment_id=requester_employment_id,
        target_department_id=target_department_id,
        limit=limit,
        offset=offset,
    )


@router.get("/requests/{request_id}", response_model=ApprovalRequestDetailResponse)
async def get_request(
    request_id: int,
    service: ApprovalServiceDep,
) -> ApprovalRequestDetailResponse:
    return await service.get_request(request_id)


@router.get(
    "/requests/by-reference/{request_type}/{reference_id}",
    response_model=ApprovalRequestDetailResponse,
)
async def get_request_by_reference(
    request_type: str,
    reference_id: int,
    service: ApprovalServiceDep,
) -> ApprovalRequestDetailResponse:
    return await service.get_request_by_reference(request_type, reference_id)


@router.post(
    "/requests/{request_id}/approve",
    response_model=ApprovalRequestDetailResponse,
)
async def approve(
    request_id: int,
    body: ApprovalActionRequest,
    service: ApprovalServiceDep,
    actor: ActorHeader,
) -> ApprovalRequestDetailResponse:
    return await service.approve(
        request_id, body, actor_employment_id=actor
    )


@router.post(
    "/requests/{request_id}/reject",
    response_model=ApprovalRequestDetailResponse,
)
async def reject(
    request_id: int,
    body: ApprovalActionRequest,
    service: ApprovalServiceDep,
    actor: ActorHeader,
) -> ApprovalRequestDetailResponse:
    return await service.reject(
        request_id, body, actor_employment_id=actor
    )


@router.post(
    "/requests/{request_id}/cancel",
    response_model=ApprovalRequestDetailResponse,
)
async def cancel(
    request_id: int,
    body: ApprovalActionRequest,
    service: ApprovalServiceDep,
    actor: ActorHeader,
) -> ApprovalRequestDetailResponse:
    return await service.cancel(
        request_id, body, actor_employment_id=actor
    )


@router.post(
    "/requests/{request_id}/comment",
    response_model=ApprovalActionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def comment(
    request_id: int,
    body: CommentRequest,
    service: ApprovalServiceDep,
    actor: ActorHeader,
) -> ApprovalActionResponse:
    return await service.comment(
        request_id, body, actor_employment_id=actor
    )
