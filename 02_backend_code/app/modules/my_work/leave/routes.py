"""My Work Leave routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.my_work.leave.schemas import (
    ApplyLeaveContext,
    CreateLeaveRequestInput,
    LeaveBalance,
    LeaveCalculateInput,
    LeaveCalculateResult,
    LeaveListResponse,
    LeaveRequest,
    LeaveTypeOption,
)
from app.modules.my_work.leave.service import MyWorkLeaveService

router = APIRouter(prefix="/my-work/leave", tags=["My Work / Leave"])


def get_leave_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MyWorkLeaveService:
    return MyWorkLeaveService(session)


ServiceDep = Annotated[MyWorkLeaveService, Depends(get_leave_service)]


@router.get("", response_model=LeaveListResponse)
async def list_leave_requests(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF"))],
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> LeaveListResponse:
    return await service.list_requests(
        employment_id=auth.employment_id,
        status=status_filter,
        search=search,
        limit=pageSize,
        offset=page,
    )


@router.get("/balances", response_model=list[LeaveBalance])
async def leave_balances(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF"))],
) -> list[LeaveBalance]:
    return await service.get_balances(auth.employment_id)


@router.get("/types", response_model=list[LeaveTypeOption])
async def leave_types(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF"))],
) -> list[LeaveTypeOption]:
    return await service.get_types()


@router.get("/apply-context", response_model=ApplyLeaveContext)
async def leave_apply_context(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF"))],
) -> ApplyLeaveContext:
    return await service.get_apply_context(auth.employment_id)


@router.post("/calculate", response_model=LeaveCalculateResult)
async def calculate_leave_days(
    service: ServiceDep,
    body: LeaveCalculateInput,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF"))],
) -> LeaveCalculateResult:
    return await service.calculate_days(employment_id=auth.employment_id, input=body)


@router.post("", response_model=LeaveRequest, status_code=status.HTTP_201_CREATED)
async def submit_leave_request(
    service: ServiceDep,
    body: CreateLeaveRequestInput,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "CREATE", "SELF"))],
) -> LeaveRequest:
    return await service.submit_request(employment_id=auth.employment_id, input=body)
