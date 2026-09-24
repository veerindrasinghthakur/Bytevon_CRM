"""Leave request routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.core.db.enums import LeaveRequestStatus
from app.modules.approvals.request.schemas import ApprovalRequestResponse
from app.modules.leave.dependencies import RequestServiceDep
from app.modules.leave.request import scoped_ops
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
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "CREATE", "ANY"))],
) -> LeaveRequestResponse:
    return await scoped_ops.submit_request_scoped(
        service,
        body,
        actor_employment_id=auth.employment_id,
        is_super_admin=auth.is_super_admin,
    )


@router.get("/requests", response_model=list[LeaveRequestResponse])
async def list_requests(
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "ANY"))],
    employment_id: int | None = Query(None),
    status_filter: LeaveRequestStatus | None = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeaveRequestResponse]:
    return await scoped_ops.list_requests_scoped(
        service,
        actor_employment_id=auth.employment_id,
        is_super_admin=auth.is_super_admin,
        employment_id=employment_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )


@router.get("/requests/{request_id}", response_model=LeaveRequestResponse)
async def get_request(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "ANY"))],
) -> LeaveRequestResponse:
    return await scoped_ops.get_request_scoped(
        service,
        request_id,
        actor_employment_id=auth.employment_id,
        is_super_admin=auth.is_super_admin,
    )


@router.post(
    "/requests/{request_id}/cancel",
    response_model=LeaveRequestResponse,
)
async def cancel_request(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "UPDATE", "ANY"))],
) -> LeaveRequestResponse:
    return await scoped_ops.cancel_request_scoped(
        service,
        request_id,
        actor_employment_id=auth.employment_id,
        is_super_admin=auth.is_super_admin,
    )


@router.post(
    "/requests/{request_id}/request-cancel",
    response_model=ApprovalRequestResponse,
)
async def request_approved_cancel(
    request_id: int,
    service: RequestServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "UPDATE", "ANY"))],
) -> ApprovalRequestResponse:
    """Q5: request cancellation of APPROVED future leave (needs approval)."""
    # Scope check via get first (404 if out of scope)
    await scoped_ops.get_request_scoped(
        service,
        request_id,
        actor_employment_id=auth.employment_id,
        is_super_admin=auth.is_super_admin,
    )
    result = await service.request_approved_cancel(
        request_id, actor_employment_id=auth.employment_id
    )
    return ApprovalRequestResponse.model_validate(result)
