"""Leave policy routes."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.core.db.enums import LeaveType
from app.modules.leave.dependencies import PolicyServiceDep
from app.modules.leave.policy.schemas import LeavePolicyCreate, LeavePolicyResponse

router = APIRouter(tags=["Leave"])


@router.post(
    "/policies",
    response_model=LeavePolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_policy(
    body: LeavePolicyCreate,
    service: PolicyServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_policy", "CREATE", "ORGANIZATION"))],
) -> LeavePolicyResponse:
    return await service.create_policy(body, actor_employment_id=auth.employment_id)


@router.get("/policies", response_model=list[LeavePolicyResponse], dependencies=[Depends(require_permission("leave_policy", "VIEW", "ORGANIZATION"))])
async def list_policies(
    service: PolicyServiceDep,
    leave_type: LeaveType | None = Query(None),
) -> list[LeavePolicyResponse]:
    return await service.list_policies(leave_type=leave_type)


@router.get("/policies/current/{leave_type}", response_model=LeavePolicyResponse, dependencies=[Depends(require_permission("leave_policy", "VIEW", "ORGANIZATION"))])
async def get_current_policy(
    leave_type: LeaveType,
    service: PolicyServiceDep,
    as_of: date | None = Query(None),
) -> LeavePolicyResponse:
    return await service.get_current_policy(leave_type, as_of=as_of)
