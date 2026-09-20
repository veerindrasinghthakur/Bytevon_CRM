"""Department operational routes under /workforce/departments (canonical owner)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.workforce.department.schemas import (
    DepartmentAssignRequest,
    DepartmentCreate,
    DepartmentEmployeeListResponse,
    DepartmentEmployeeOption,
    DepartmentListResponse,
    DepartmentResponse,
    DepartmentUpdate,
    MessageResponse,
)
from app.modules.workforce.dependencies import DepartmentServiceDep

router = APIRouter(prefix="/departments", tags=["Workforce Departments"])


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    body: DepartmentCreate, service: DepartmentServiceDep, auth: Annotated[AuthContext, Depends(require_permission("department", "CREATE", "ORGANIZATION"))]
) -> DepartmentResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("", response_model=DepartmentListResponse, dependencies=[Depends(require_permission("department", "VIEW", "ORGANIZATION"))])
async def list_departments(
    service: DepartmentServiceDep,
    include_archived: bool = Query(False),
    include_deleted: bool = Query(False),
) -> DepartmentListResponse:
    return await service.list(include_archived=include_archived, include_deleted=include_deleted)


@router.get("/{department_id}", response_model=DepartmentResponse, dependencies=[Depends(require_permission("department", "VIEW", "ORGANIZATION"))])
async def get_department(
    department_id: int, service: DepartmentServiceDep
) -> DepartmentResponse:
    return await service.get(department_id)


@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    body: DepartmentUpdate,
    service: DepartmentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("department", "UPDATE", "ORGANIZATION"))],
) -> DepartmentResponse:
    return await service.update(department_id, body, actor_employment_id=auth.employment_id)


@router.delete("/{department_id}", response_model=MessageResponse)
async def delete_department(
    department_id: int, service: DepartmentServiceDep, auth: Annotated[AuthContext, Depends(require_permission("department", "UPDATE", "ORGANIZATION"))]
) -> MessageResponse:
    return await service.delete(department_id, actor_employment_id=auth.employment_id)


# Deprecated alias — old clients/tests calling POST .../archive keep working
@router.post("/{department_id}/archive", response_model=MessageResponse, include_in_schema=False)
async def archive_department_alias(
    department_id: int, service: DepartmentServiceDep, auth: Annotated[AuthContext, Depends(require_permission("department", "UPDATE", "ORGANIZATION"))]
) -> MessageResponse:
    return await service.delete(department_id, actor_employment_id=auth.employment_id)


@router.get("/{department_id}/employees", response_model=DepartmentEmployeeListResponse, dependencies=[Depends(require_permission("department", "VIEW", "DEPARTMENT"))])
async def list_department_employees(
    department_id: int,
    service: DepartmentServiceDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
) -> DepartmentEmployeeListResponse:
    return await service.list_employees(
        department_id, page=page, page_size=pageSize, search=search
    )


@router.get(
    "/{department_id}/employees-available",
    response_model=list[DepartmentEmployeeOption],
    dependencies=[Depends(require_permission("department", "VIEW", "DEPARTMENT"))],
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
    auth: Annotated[AuthContext, Depends(require_permission("department", "UPDATE", "DEPARTMENT"))],
) -> MessageResponse:
    return await service.assign(
        department_id, body.employmentId, actor_employment_id=auth.employment_id
    )


@router.post("/{department_id}/remove", response_model=MessageResponse)
async def remove(
    department_id: int,
    body: DepartmentAssignRequest,
    service: DepartmentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("department", "UPDATE", "DEPARTMENT"))],
) -> MessageResponse:
    return await service.remove(
        department_id, body.employmentId, actor_employment_id=auth.employment_id
    )
