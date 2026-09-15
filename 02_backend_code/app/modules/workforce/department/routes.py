"""Department operational routes under /workforce/departments."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.workforce.dependencies import DepartmentServiceDep
from app.modules.workforce.department.schemas import (
    DepartmentAssignRequest,
    DepartmentCreate,
    DepartmentEmployeeListResponse,
    DepartmentEmployeeOption,
    DepartmentResponse,
    DepartmentUpdate,
    MessageResponse,
)

router = APIRouter(prefix="/departments", tags=["Workforce Departments"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    body: DepartmentCreate, service: DepartmentServiceDep, actor: ActorHeader = None
) -> DepartmentResponse:
    return await service.create(body, actor_employment_id=actor)


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(
    service: DepartmentServiceDep, include_archived: bool = Query(False)
) -> list[DepartmentResponse]:
    return await service.list(include_archived=include_archived)


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: int, service: DepartmentServiceDep
) -> DepartmentResponse:
    return await service.get(department_id)


@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    body: DepartmentUpdate,
    service: DepartmentServiceDep,
    actor: ActorHeader = None,
) -> DepartmentResponse:
    return await service.update(department_id, body, actor_employment_id=actor)


@router.post("/{department_id}/archive", response_model=MessageResponse)
async def archive_department(
    department_id: int, service: DepartmentServiceDep, actor: ActorHeader = None
) -> MessageResponse:
    return await service.archive(department_id, actor_employment_id=actor)


@router.get("/{department_id}/employees", response_model=DepartmentEmployeeListResponse)
async def list_department_employees(
    department_id: int,
    service: DepartmentServiceDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
) -> DepartmentEmployeeListResponse:
    return await service.list_employees(
        department_id, page=page, page_size=pageSize, search=search
    )


@router.get(
    "/{department_id}/employees-available",
    response_model=list[DepartmentEmployeeOption],
)
async def list_available(
    department_id: int, service: DepartmentServiceDep
) -> list[DepartmentEmployeeOption]:
    return await service.list_available(department_id)


@router.post("/{department_id}/assign", response_model=MessageResponse)
async def assign(
    department_id: int,
    body: DepartmentAssignRequest,
    service: DepartmentServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.assign(
        department_id, body.employmentId, actor_employment_id=actor
    )


@router.post("/{department_id}/remove", response_model=MessageResponse)
async def remove(
    department_id: int,
    body: DepartmentAssignRequest,
    service: DepartmentServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.remove(
        department_id, body.employmentId, actor_employment_id=actor
    )
