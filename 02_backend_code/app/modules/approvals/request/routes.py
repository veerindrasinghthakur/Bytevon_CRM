"""Approval request routes — /approvals/requests + UI list helpers."""
from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.db.enums import ApprovalStatus
from app.modules.approvals.dependencies import RequestServiceDep
from app.modules.approvals.request.schemas import (
    ApprovalRequestCreate,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
)

router = APIRouter(prefix="/approvals", tags=["Approvals — Requests"])

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


@router.get("/kpis", dependencies=[Depends(require_permission("approval", "VIEW", "ORGANIZATION"))])
async def approval_kpis(service: RequestServiceDep) -> dict[str, int]:
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


@router.get("/pending", dependencies=[Depends(require_permission("approval", "VIEW", "ORGANIZATION"))])
async def list_pending(
    service: RequestServiceDep,
    search: str | None = Query(None),
    type: str | None = Query(None),
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
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "VIEW", "ORGANIZATION"))],
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    st: ApprovalStatus | None = None
    if status_filter and status_filter not in ("All", ""):
        try:
            st = ApprovalStatus(status_filter.upper())
        except ValueError:
            st = None
    rows = await service.list_requests(
        status=st,
        requester_employment_id=auth.employment_id,
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


@router.get("/approvers", dependencies=[Depends(require_permission("approval", "VIEW", "ORGANIZATION"))])
async def list_approvers() -> list[dict[str, str]]:
    return [
        {"value": "1", "label": "Manager (Emp #1)"},
        {"value": "2", "label": "HR (Emp #2)"},
    ]


@router.post(
    "/requests",
    response_model=ApprovalRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_request(
    body: ApprovalRequestCreate,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "CREATE", "ORGANIZATION"))],
) -> ApprovalRequestResponse:
    return await service.create_request(body, actor_employment_id=auth.employment_id)


@router.get("/requests", response_model=list[ApprovalRequestResponse], dependencies=[Depends(require_permission("approval", "VIEW", "ORGANIZATION"))])
async def list_requests(
    service: RequestServiceDep,
    status_filter: ApprovalStatus | None = Query(None, alias="status"),
    request_type: str | None = Query(None),
    requester_employment_id: int | None = Query(None),
    target_department_id: int | None = Query(None),
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
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "VIEW", "CUSTOM"))],
) -> ApprovalRequestDetailResponse:
    detail = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "approval", "VIEW", owner_employment_id=detail.requester_employment_id)
    return detail


@router.get(
    "/requests/by-reference/{request_type}/{reference_id}",
    response_model=ApprovalRequestDetailResponse,
)
async def get_request_by_reference(
    request_type: str,
    reference_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "VIEW", "CUSTOM"))],
) -> ApprovalRequestDetailResponse:
    detail = await service.get_request_by_reference(request_type, reference_id)
    enforce_owner_or_grant(auth, "approval", "VIEW", owner_employment_id=detail.requester_employment_id)
    return detail


@router.get("/{request_id}")
async def get_request_ui(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "VIEW", "CUSTOM"))],
) -> dict[str, Any]:
    detail = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "approval", "VIEW", owner_employment_id=detail.requester_employment_id)
    row = _ui_row(detail)
    row["actions"] = [
        a.model_dump(mode="json") if hasattr(a, "model_dump") else a
        for a in (detail.actions or [])
    ]
    return row
