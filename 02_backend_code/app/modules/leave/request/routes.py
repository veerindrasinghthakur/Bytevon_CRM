"""Leave request routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import LeaveRequestStatus
from app.modules.leave.dependencies import RequestServiceDep
from app.modules.leave.request.schemas import LeaveRequestCreate, LeaveRequestResponse

router = APIRouter(tags=["Leave"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/requests",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_request(
    body: LeaveRequestCreate,
    service: RequestServiceDep,
    actor: ActorHeader = None,
) -> LeaveRequestResponse:
    return await service.submit_request(body, actor_employment_id=actor)


@router.get("/requests", response_model=list[LeaveRequestResponse])
async def list_requests(
    service: RequestServiceDep,
    employment_id: Optional[int] = Query(None),
    status_filter: Optional[LeaveRequestStatus] = Query(None, alias="status"),
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
) -> LeaveRequestResponse:
    return await service.get_request(request_id)


@router.post(
    "/requests/{request_id}/cancel",
    response_model=LeaveRequestResponse,
)
async def cancel_request(
    request_id: int,
    service: RequestServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> LeaveRequestResponse:
    return await service.cancel_request(request_id, actor_employment_id=actor)
