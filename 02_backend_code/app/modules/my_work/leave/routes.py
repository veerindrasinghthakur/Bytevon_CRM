"""My Work Leave routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

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
    employment_id: Annotated[Optional[int], Query()] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> LeaveListResponse:
    return await service.list_requests(
        employment_id=employment_id,
        status=status_filter,
        search=search,
        limit=pageSize,
        offset=page,
    )


@router.get("/balances", response_model=list[LeaveBalance])
async def leave_balances(
    service: ServiceDep,
    employment_id: Annotated[Optional[int], Query()] = None,
) -> list[LeaveBalance]:
    return await service.get_balances(employment_id)


@router.get("/types", response_model=list[LeaveTypeOption])
async def leave_types(service: ServiceDep) -> list[LeaveTypeOption]:
    return await service.get_types()


@router.get("/apply-context", response_model=ApplyLeaveContext)
async def leave_apply_context(
    service: ServiceDep,
    employment_id: Annotated[Optional[int], Query()] = None,
) -> ApplyLeaveContext:
    return await service.get_apply_context(employment_id)


@router.post("/calculate", response_model=LeaveCalculateResult)
async def calculate_leave_days(
    service: ServiceDep,
    body: LeaveCalculateInput,
    employment_id: Annotated[Optional[int], Query()] = None,
) -> LeaveCalculateResult:
    return await service.calculate_days(employment_id=employment_id, input=body)


@router.post("", response_model=LeaveRequest, status_code=status.HTTP_201_CREATED)
async def submit_leave_request(
    service: ServiceDep,
    body: CreateLeaveRequestInput,
    employment_id: Annotated[Optional[int], Query()] = None,
) -> LeaveRequest:
    return await service.submit_request(employment_id=employment_id, input=body)
