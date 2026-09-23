"""Leave type master routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.leave.dependencies import LeaveTypeServiceDep
from app.modules.leave.leave_type.schemas import (
    LeaveTypeCreate,
    LeaveTypeResponse,
    LeaveTypeUpdate,
)

router = APIRouter(tags=["Leave"])


@router.post(
    "/types",
    response_model=LeaveTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_leave_type(
    body: LeaveTypeCreate,
    service: LeaveTypeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_policy", "CREATE", "ORGANIZATION"))],
) -> LeaveTypeResponse:
    return await service.create_type(body, actor_employment_id=auth.employment_id)


@router.get(
    "/types",
    response_model=list[LeaveTypeResponse],
    dependencies=[Depends(require_permission("leave_policy", "VIEW", "ORGANIZATION"))],
)
async def list_leave_types(
    service: LeaveTypeServiceDep,
    include_archived: bool = Query(False),
) -> list[LeaveTypeResponse]:
    return await service.list_types(include_archived=include_archived)


@router.get(
    "/types/{type_id}",
    response_model=LeaveTypeResponse,
    dependencies=[Depends(require_permission("leave_policy", "VIEW", "ORGANIZATION"))],
)
async def get_leave_type(
    type_id: int,
    service: LeaveTypeServiceDep,
) -> LeaveTypeResponse:
    return await service.get_type(type_id)


@router.patch(
    "/types/{type_id}",
    response_model=LeaveTypeResponse,
)
async def update_leave_type(
    type_id: int,
    body: LeaveTypeUpdate,
    service: LeaveTypeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_policy", "UPDATE", "ORGANIZATION"))],
) -> LeaveTypeResponse:
    return await service.update_type(
        type_id, body, actor_employment_id=auth.employment_id
    )


@router.post(
    "/types/{type_id}/soft-delete",
    response_model=LeaveTypeResponse,
)
async def soft_delete_leave_type(
    type_id: int,
    service: LeaveTypeServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_policy", "UPDATE", "ORGANIZATION"))],
) -> LeaveTypeResponse:
    return await service.soft_delete_type(
        type_id, actor_employment_id=auth.employment_id
    )
