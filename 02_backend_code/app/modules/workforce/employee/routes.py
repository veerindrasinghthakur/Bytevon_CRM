"""Employee routes — persons, positions, employments."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.db.enums import EmploymentState
from app.modules.workforce.dependencies import EmployeeServiceDep
from app.modules.workforce.employee.schemas import (
    EmployeeCreate,
    EmploymentCreate,
    EmploymentDetailResponse,
    EmploymentResponse,
    EmploymentUpdate,
    MessageResponse,
    PersonCreate,
    PersonResponse,
    PersonUpdate,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
    RehireRequest,
)

router = APIRouter(tags=["Workforce Employees"])


@router.post("/persons", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    body: PersonCreate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> PersonResponse:
    return await service.create_person_response(body, actor_employment_id=auth.employment_id)


@router.get("/persons", response_model=list[PersonResponse], dependencies=[Depends(require_permission("employment", "VIEW", "ORGANIZATION"))])
async def list_persons(
    service: EmployeeServiceDep,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[PersonResponse]:
    return await service.list_persons(limit=limit, offset=offset)


@router.get("/persons/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: int,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF", union=True))],
) -> PersonResponse:
    enforce_owner_or_grant(auth, "employment", "VIEW", owner_person_id=person_id)
    return await service.get_person(person_id)


@router.patch("/persons/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: int,
    body: PersonUpdate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "SELF", union=True))],
) -> PersonResponse:
    enforce_owner_or_grant(auth, "employment", "UPDATE", owner_person_id=person_id)
    return await service.update_person(person_id, body, actor_employment_id=auth.employment_id)


@router.post("/positions", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    body: PositionCreate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> PositionResponse:
    return await service.create_position(body, actor_employment_id=auth.employment_id)


@router.get("/positions", response_model=list[PositionResponse], dependencies=[Depends(require_permission("employment", "VIEW", "ORGANIZATION"))])
async def list_positions(
    service: EmployeeServiceDep,
    include_archived: bool = Query(False),
    department_id: int | None = Query(None, description="Scope to a department (plus unassigned)"),
) -> list[PositionResponse]:
    return await service.list_positions(include_archived=include_archived, department_id=department_id)


@router.get("/positions/{position_id}", response_model=PositionResponse)
async def get_position(
    position_id: int,
    service: EmployeeServiceDep,
    # Grant-only quirk: no owner args — do not invent self-access.
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF", union=True))],
    include_archived: bool = Query(False),
) -> PositionResponse:
    enforce_owner_or_grant(auth, "employment", "VIEW")
    return await service.get_position(position_id, include_archived=include_archived)


@router.patch("/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    body: PositionUpdate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "SELF", union=True))],
) -> PositionResponse:
    enforce_owner_or_grant(auth, "employment", "UPDATE")
    return await service.update_position(position_id, body, actor_employment_id=auth.employment_id)


@router.delete("/positions/{position_id}", response_model=MessageResponse)
async def delete_position(
    position_id: int,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete_position(position_id, actor_employment_id=auth.employment_id)


@router.post("/positions/{position_id}/archive", response_model=MessageResponse, include_in_schema=False)
async def archive_position(
    position_id: int,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.delete_position(position_id, actor_employment_id=auth.employment_id)


@router.post("/positions/{position_id}/restore", response_model=PositionResponse)
async def restore_position(
    position_id: int,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "ORGANIZATION"))],
) -> PositionResponse:
    return await service.restore_position(position_id, actor_employment_id=auth.employment_id)


@router.post(
    "/employees",
    response_model=EmploymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create person + employment in one request",
)
async def create_employee(
    body: EmployeeCreate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> EmploymentDetailResponse:
    return await service.create_employee(body, actor_employment_id=auth.employment_id)


@router.post(
    "/employments",
    response_model=EmploymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_employment(
    body: EmploymentCreate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> EmploymentDetailResponse:
    return await service.create_employment(body, actor_employment_id=auth.employment_id)


@router.get("/employments", response_model=list[EmploymentResponse], dependencies=[Depends(require_permission("employment", "VIEW", "ORGANIZATION"))])
async def list_employments(
    service: EmployeeServiceDep,
    state: EmploymentState | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[EmploymentResponse]:
    return await service.list_employments(state=state, limit=limit, offset=offset)


@router.get("/employments/by-person/{person_id}", response_model=list[EmploymentResponse])
async def list_employments_by_person(
    person_id: int,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF", union=True))],
) -> list[EmploymentResponse]:
    enforce_owner_or_grant(auth, "employment", "VIEW", owner_person_id=person_id)
    return await service.list_employments_by_person(person_id)


@router.get("/employments/{employment_id}", response_model=EmploymentDetailResponse)
async def get_employment(
    employment_id: int,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF", union=True))],
) -> EmploymentDetailResponse:
    enforce_owner_or_grant(auth, "employment", "VIEW", owner_employment_id=employment_id)
    return await service.get_employment(employment_id)


@router.post(
    "/employments/{employment_id}/rehire",
    response_model=EmploymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Q7: rehire — new Employment row for the same Person",
)
async def rehire_employment(
    employment_id: int,
    body: RehireRequest,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "CREATE", "ORGANIZATION"))],
) -> EmploymentDetailResponse:
    return await service.rehire_employment(
        employment_id, body, actor_employment_id=auth.employment_id
    )


@router.patch("/employments/{employment_id}", response_model=EmploymentResponse)
async def update_employment(
    employment_id: int,
    body: EmploymentUpdate,
    service: EmployeeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "SELF", union=True))],
) -> EmploymentResponse:
    enforce_owner_or_grant(auth, "employment", "UPDATE", owner_employment_id=employment_id)
    return await service.update_employment(employment_id, body, actor_employment_id=auth.employment_id)
