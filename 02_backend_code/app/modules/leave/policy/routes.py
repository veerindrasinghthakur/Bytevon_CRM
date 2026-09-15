"""Leave policy routes."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import LeaveType
from app.modules.leave.dependencies import PolicyServiceDep
from app.modules.leave.policy.schemas import LeavePolicyCreate, LeavePolicyResponse

router = APIRouter(tags=["Leave"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/policies",
    response_model=LeavePolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_policy(
    body: LeavePolicyCreate,
    service: PolicyServiceDep,
    actor: ActorHeader = None,
) -> LeavePolicyResponse:
    return await service.create_policy(body, actor_employment_id=actor)


@router.get("/policies", response_model=list[LeavePolicyResponse])
async def list_policies(
    service: PolicyServiceDep,
    leave_type: Optional[LeaveType] = Query(None),
) -> list[LeavePolicyResponse]:
    return await service.list_policies(leave_type=leave_type)


@router.get("/policies/current/{leave_type}", response_model=LeavePolicyResponse)
async def get_current_policy(
    leave_type: LeaveType,
    service: PolicyServiceDep,
    as_of: Optional[date] = Query(None),
) -> LeavePolicyResponse:
    return await service.get_current_policy(leave_type, as_of=as_of)
