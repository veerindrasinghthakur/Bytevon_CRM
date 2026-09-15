"""Assignment + state routes under /employments/{id}/…."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.workforce.assignment.schemas import (
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
)
from app.modules.workforce.dependencies import AssignmentServiceDep

router = APIRouter(tags=["Workforce Assignments"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/employments/{employment_id}/state",
    response_model=EmploymentStateHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def change_state(
    employment_id: int,
    body: EmploymentStateChangeRequest,
    service: AssignmentServiceDep,
    actor: ActorHeader = None,
) -> EmploymentStateHistoryResponse:
    return await service.change_state(employment_id, body, actor_employment_id=actor)


@router.get(
    "/employments/{employment_id}/state-history",
    response_model=list[EmploymentStateHistoryResponse],
)
async def list_state_history(
    employment_id: int,
    service: AssignmentServiceDep,
    limit: int = Query(50, ge=1, le=200),
) -> list[EmploymentStateHistoryResponse]:
    return await service.list_state_history(employment_id, limit=limit)


@router.post(
    "/employments/{employment_id}/assignments",
    response_model=EmploymentAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    employment_id: int,
    body: EmploymentAssignmentCreate,
    service: AssignmentServiceDep,
    actor: ActorHeader = None,
) -> EmploymentAssignmentResponse:
    return await service.create_assignment(employment_id, body, actor_employment_id=actor)


@router.get(
    "/employments/{employment_id}/assignments/current",
    response_model=EmploymentAssignmentResponse,
)
async def get_current_assignment(
    employment_id: int,
    service: AssignmentServiceDep,
    as_of: Optional[date] = Query(None),
) -> EmploymentAssignmentResponse:
    return await service.get_current_assignment(employment_id, as_of=as_of)


@router.get(
    "/employments/{employment_id}/assignments",
    response_model=list[EmploymentAssignmentResponse],
)
async def list_assignments(
    employment_id: int, service: AssignmentServiceDep
) -> list[EmploymentAssignmentResponse]:
    return await service.list_assignments(employment_id)
