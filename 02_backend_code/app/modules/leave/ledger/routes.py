"""Leave ledger / balance / apply routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import LeaveType
from app.modules.leave.dependencies import LedgerServiceDep
from app.modules.leave.ledger.schemas import (
    ApplyLeaveContextResponse,
    LeaveBalanceResponse,
    LeaveCalculateRequest,
    LeaveCalculateResponse,
    LeaveLedgerCreate,
    LeaveLedgerResponse,
)

router = APIRouter(tags=["Leave"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/ledger",
    response_model=LeaveLedgerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_ledger_entry(
    body: LeaveLedgerCreate,
    service: LedgerServiceDep,
    actor: ActorHeader = None,
) -> LeaveLedgerResponse:
    return await service.post_ledger_entry(body, actor_employment_id=actor)


@router.get(
    "/ledger/{employment_id}",
    response_model=list[LeaveLedgerResponse],
)
async def list_ledger(
    employment_id: int,
    service: LedgerServiceDep,
    leave_type: Optional[LeaveType] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
) -> list[LeaveLedgerResponse]:
    return await service.list_ledger(
        employment_id, leave_type=leave_type, limit=limit
    )


@router.get(
    "/balances/{employment_id}",
    response_model=LeaveBalanceResponse,
)
async def get_balances(
    employment_id: int,
    service: LedgerServiceDep,
) -> LeaveBalanceResponse:
    return await service.get_balances(employment_id)


@router.get(
    "/apply-context/{employment_id}",
    response_model=ApplyLeaveContextResponse,
)
async def get_apply_context(
    employment_id: int,
    service: LedgerServiceDep,
    holiday_calendar_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
) -> ApplyLeaveContextResponse:
    return await service.get_apply_context(
        employment_id,
        holiday_calendar_id=holiday_calendar_id,
        year=year,
    )


@router.post(
    "/calculate",
    response_model=LeaveCalculateResponse,
)
async def calculate_leave_days(
    body: LeaveCalculateRequest,
    service: LedgerServiceDep,
) -> LeaveCalculateResponse:
    return await service.calculate_leave_days(body)
