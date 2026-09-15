"""Employee routes — persons, positions, employments."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

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
)

router = APIRouter(tags=["Workforce Employees"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/persons", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    body: PersonCreate, service: EmployeeServiceDep, actor: ActorHeader = None
) -> PersonResponse:
    return await service.create_person_response(body, actor_employment_id=actor)


@router.get("/persons", response_model=list[PersonResponse])
async def list_persons(
    service: EmployeeServiceDep,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[PersonResponse]:
    return await service.list_persons(limit=limit, offset=offset)


@router.get("/persons/{person_id}", response_model=PersonResponse)
async def get_person(person_id: int, service: EmployeeServiceDep) -> PersonResponse:
    return await service.get_person(person_id)


@router.patch("/persons/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: int, body: PersonUpdate, service: EmployeeServiceDep, actor: ActorHeader = None
) -> PersonResponse:
    return await service.update_person(person_id, body, actor_employment_id=actor)


@router.post("/positions", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    body: PositionCreate, service: EmployeeServiceDep, actor: ActorHeader = None
) -> PositionResponse:
    return await service.create_position(body, actor_employment_id=actor)


@router.get("/positions", response_model=list[PositionResponse])
async def list_positions(
    service: EmployeeServiceDep, include_archived: bool = Query(False)
) -> list[PositionResponse]:
    return await service.list_positions(include_archived=include_archived)


@router.get("/positions/{position_id}", response_model=PositionResponse)
async def get_position(position_id: int, service: EmployeeServiceDep) -> PositionResponse:
    return await service.get_position(position_id)


@router.patch("/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int, body: PositionUpdate, service: EmployeeServiceDep, actor: ActorHeader = None
) -> PositionResponse:
    return await service.update_position(position_id, body, actor_employment_id=actor)


@router.post("/positions/{position_id}/archive", response_model=MessageResponse)
async def archive_position(
    position_id: int, service: EmployeeServiceDep, actor: ActorHeader = None
) -> MessageResponse:
    return await service.archive_position(position_id, actor_employment_id=actor)


@router.post(
    "/employees",
    response_model=EmploymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create person + employment in one request",
)
async def create_employee(
    body: EmployeeCreate, service: EmployeeServiceDep, actor: ActorHeader = None
) -> EmploymentDetailResponse:
    return await service.create_employee(body, actor_employment_id=actor)


@router.post(
    "/employments",
    response_model=EmploymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_employment(
    body: EmploymentCreate, service: EmployeeServiceDep, actor: ActorHeader = None
) -> EmploymentDetailResponse:
    return await service.create_employment(body, actor_employment_id=actor)


@router.get("/employments", response_model=list[EmploymentResponse])
async def list_employments(
    service: EmployeeServiceDep,
    state: Optional[EmploymentState] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[EmploymentResponse]:
    return await service.list_employments(state=state, limit=limit, offset=offset)


@router.get("/employments/by-person/{person_id}", response_model=list[EmploymentResponse])
async def list_employments_by_person(
    person_id: int, service: EmployeeServiceDep
) -> list[EmploymentResponse]:
    return await service.list_employments_by_person(person_id)


@router.get("/employments/{employment_id}", response_model=EmploymentDetailResponse)
async def get_employment(
    employment_id: int, service: EmployeeServiceDep
) -> EmploymentDetailResponse:
    return await service.get_employment(employment_id)


@router.patch("/employments/{employment_id}", response_model=EmploymentResponse)
async def update_employment(
    employment_id: int,
    body: EmploymentUpdate,
    service: EmployeeServiceDep,
    actor: ActorHeader = None,
) -> EmploymentResponse:
    return await service.update_employment(employment_id, body, actor_employment_id=actor)
