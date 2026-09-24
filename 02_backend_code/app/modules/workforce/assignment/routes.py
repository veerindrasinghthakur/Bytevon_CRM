"""Assignment + state routes under /employments/{id}/…."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.modules.workforce.assignment.schemas import (
    EmploymentAssignmentCreate,
    EmploymentAssignmentResponse,
    EmploymentStateChangeRequest,
    EmploymentStateHistoryResponse,
)
from app.modules.workforce.dependencies import AssignmentServiceDep

router = APIRouter(tags=["Workforce Assignments"])


@router.post(
    "/employments/{employment_id}/state",
    response_model=EmploymentStateHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def change_state(
    employment_id: int,
    body: EmploymentStateChangeRequest,
    service: AssignmentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "ORGANIZATION"))],
) -> EmploymentStateHistoryResponse:
    return await service.change_state(employment_id, body, actor_employment_id=auth.employment_id)


@router.get(
    "/employments/{employment_id}/state-history",
    response_model=list[EmploymentStateHistoryResponse],
)
async def list_state_history(
    employment_id: int,
    service: AssignmentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
    limit: int = Query(50, ge=1, le=200),
) -> list[EmploymentStateHistoryResponse]:
    enforce_owner_or_grant(auth, "employment", "VIEW", owner_employment_id=employment_id)
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
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> EmploymentAssignmentResponse:
    return await service.create_assignment(employment_id, body, actor_employment_id=auth.employment_id)


@router.get(
    "/employments/{employment_id}/assignments/current",
    response_model=EmploymentAssignmentResponse,
)
async def get_current_assignment(
    employment_id: int,
    service: AssignmentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
    as_of: date | None = Query(None),
) -> EmploymentAssignmentResponse:
    enforce_owner_or_grant(auth, "employment", "VIEW", owner_employment_id=employment_id)
    return await service.get_current_assignment(employment_id, as_of=as_of)


@router.get(
    "/employments/{employment_id}/assignments",
    response_model=list[EmploymentAssignmentResponse],
)
async def list_assignments(
    employment_id: int,
    service: AssignmentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
) -> list[EmploymentAssignmentResponse]:
    enforce_owner_or_grant(auth, "employment", "VIEW", owner_employment_id=employment_id)
    return await service.list_assignments(employment_id)
