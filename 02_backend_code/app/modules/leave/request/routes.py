"""Leave request routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.db.enums import LeaveRequestStatus
from app.modules.approvals.request.schemas import ApprovalRequestResponse
from app.modules.leave.dependencies import RequestServiceDep
from app.modules.leave.request.schemas import LeaveRequestCreate, LeaveRequestResponse

router = APIRouter(tags=["Leave"])


@router.post(
    "/requests",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_request(
    body: LeaveRequestCreate,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "CREATE", "SELF"))],
) -> LeaveRequestResponse:
    enforce_owner_or_grant(auth, "leave_request", "CREATE", owner_employment_id=body.employment_id)
    return await service.submit_request(body, actor_employment_id=auth.employment_id)


@router.get("/requests", response_model=list[LeaveRequestResponse], dependencies=[Depends(require_permission("leave_request", "VIEW", "ORGANIZATION"))])
async def list_requests(
    service: RequestServiceDep,
    employment_id: int | None = Query(None),
    status_filter: LeaveRequestStatus | None = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeaveRequestResponse]:
    return await service.list_requests(
        employment_id=employment_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )


@router.get("/requests/{request_id}", response_model=LeaveRequestResponse)
async def get_request(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF", union=True))],
) -> LeaveRequestResponse:
    req = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "leave_request", "VIEW", owner_employment_id=req.employment_id)
    return req


@router.post(
    "/requests/{request_id}/cancel",
    response_model=LeaveRequestResponse,
)
async def cancel_request(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "UPDATE", "SELF", union=True))],
) -> LeaveRequestResponse:
    req = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "leave_request", "UPDATE", owner_employment_id=req.employment_id)
    return await service.cancel_request(request_id, actor_employment_id=auth.employment_id)


@router.post(
    "/requests/{request_id}/request-cancel",
    response_model=ApprovalRequestResponse,
)
async def request_approved_cancel(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "UPDATE", "SELF", union=True))],
) -> ApprovalRequestResponse:
    """Q5: request cancellation of APPROVED future leave (needs approval)."""
    req = await service.get_request(request_id)
    enforce_owner_or_grant(auth, "leave_request", "UPDATE", owner_employment_id=req.employment_id)
    result = await service.request_approved_cancel(
        request_id, actor_employment_id=auth.employment_id
    )
    return ApprovalRequestResponse.model_validate(result)
