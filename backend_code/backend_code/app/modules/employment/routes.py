"""
Employment HTTP routes.

All operations go through EmploymentPublicService.
Actor temporarily from X-Employment-Id header.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import EmploymentState
from app.modules.employment.dependencies import EmploymentServiceDep
from app.modules.employment.schemas.schemas import (
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentCreate,
    EmploymentDetailResponse,
    EmploymentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
    EmploymentUpdate,
    MessageResponse,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
)

router = APIRouter(prefix="/employment", tags=["Employment"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------------

@router.post(
    "/positions",
    response_model=PositionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position(
    body: PositionCreate,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> PositionResponse:
    return await service.create_position(body, actor_employment_id=actor)


@router.get("/positions", response_model=list[PositionResponse])
async def list_positions(
    service: EmploymentServiceDep,
    include_archived: bool = Query(False),
) -> list[PositionResponse]:
    return await service.list_positions(include_archived=include_archived)


@router.get("/positions/{position_id}", response_model=PositionResponse)
async def get_position(
    position_id: int,
    service: EmploymentServiceDep,
) -> PositionResponse:
    return await service.get_position(position_id)


@router.patch("/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    body: PositionUpdate,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> PositionResponse:
    return await service.update_position(
        position_id, body, actor_employment_id=actor
    )


@router.post("/positions/{position_id}/archive", response_model=MessageResponse)
async def archive_position(
    position_id: int,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_position(position_id, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Employments
# ---------------------------------------------------------------------------

@router.post(
    "/employments",
    response_model=EmploymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_employment(
    body: EmploymentCreate,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> EmploymentDetailResponse:
    return await service.create_employment(body, actor_employment_id=actor)


@router.get("/employments", response_model=list[EmploymentResponse])
async def list_employments(
    service: EmploymentServiceDep,
    state: Optional[EmploymentState] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[EmploymentResponse]:
    return await service.list_employments(state=state, limit=limit, offset=offset)


@router.get(
    "/employments/by-person/{person_id}",
    response_model=list[EmploymentResponse],
)
async def list_employments_by_person(
    person_id: int,
    service: EmploymentServiceDep,
) -> list[EmploymentResponse]:
    return await service.list_employments_by_person(person_id)


@router.get(
    "/employments/{employment_id}",
    response_model=EmploymentDetailResponse,
)
async def get_employment(
    employment_id: int,
    service: EmploymentServiceDep,
) -> EmploymentDetailResponse:
    return await service.get_employment(employment_id)


@router.patch(
    "/employments/{employment_id}",
    response_model=EmploymentResponse,
)
async def update_employment(
    employment_id: int,
    body: EmploymentUpdate,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> EmploymentResponse:
    return await service.update_employment(
        employment_id, body, actor_employment_id=actor
    )


# ---------------------------------------------------------------------------
# State changes
# ---------------------------------------------------------------------------

@router.post(
    "/employments/{employment_id}/state",
    response_model=EmploymentStateHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def change_state(
    employment_id: int,
    body: EmploymentStateChangeRequest,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> EmploymentStateHistoryResponse:
    return await service.change_state(
        employment_id, body, actor_employment_id=actor
    )


@router.get(
    "/employments/{employment_id}/state-history",
    response_model=list[EmploymentStateHistoryResponse],
)
async def list_state_history(
    employment_id: int,
    service: EmploymentServiceDep,
    limit: int = Query(50, ge=1, le=200),
) -> list[EmploymentStateHistoryResponse]:
    return await service.list_state_history(employment_id, limit=limit)


# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------

@router.post(
    "/employments/{employment_id}/assignments",
    response_model=EmploymentAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    employment_id: int,
    body: EmploymentAssignmentCreate,
    service: EmploymentServiceDep,
    actor: ActorHeader = None,
) -> EmploymentAssignmentResponse:
    return await service.create_assignment(
        employment_id, body, actor_employment_id=actor
    )


@router.get(
    "/employments/{employment_id}/assignments/current",
    response_model=EmploymentAssignmentResponse,
)
async def get_current_assignment(
    employment_id: int,
    service: EmploymentServiceDep,
    as_of: Optional[date] = Query(None),
) -> EmploymentAssignmentResponse:
    return await service.get_current_assignment(employment_id, as_of=as_of)


@router.get(
    "/employments/{employment_id}/assignments",
    response_model=list[EmploymentAssignmentResponse],
)
async def list_assignments(
    employment_id: int,
    service: EmploymentServiceDep,
) -> list[EmploymentAssignmentResponse]:
    return await service.list_assignments(employment_id)
