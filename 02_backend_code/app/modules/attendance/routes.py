"""
Attendance module — POLICY routes only.

Operational attendance (punch, days, corrections, summaries, breaks) lives under
workforce (/workforce/attendance/*).
Self-service (my punch / my day) lives under my-work (/my-work/attendance/*).

This package keeps models + policy HTTP until policies move fully under admin.
"""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.modules.attendance.dependencies import AttendanceServiceDep
from app.modules.attendance.schemas.schemas import (
    AttendancePolicyCreate,
    AttendancePolicyResponse,
)

router = APIRouter(prefix="/attendance", tags=["Attendance Policies"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/policies",
    response_model=AttendancePolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_policy(
    body: AttendancePolicyCreate,
    service: AttendanceServiceDep,
    actor: ActorHeader = None,
) -> AttendancePolicyResponse:
    return await service.create_policy(body, actor_employment_id=actor)


@router.get("/policies", response_model=list[AttendancePolicyResponse])
async def list_policies(
    service: AttendanceServiceDep,
) -> list[AttendancePolicyResponse]:
    return await service.list_policies()


@router.get("/policies/current", response_model=AttendancePolicyResponse)
async def get_current_policy(
    service: AttendanceServiceDep,
    as_of: Optional[date] = Query(None),
) -> AttendancePolicyResponse:
    return await service.get_current_policy(as_of=as_of)
