"""
Approvals HTTP routes.
"""

from __future__ import annotations

from typing import Annotated, Optional

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
