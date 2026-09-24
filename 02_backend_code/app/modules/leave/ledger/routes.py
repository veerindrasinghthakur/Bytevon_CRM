"""Leave ledger / balance / apply routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
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


@router.post(
    "/ledger",
    response_model=LeaveLedgerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_ledger_entry(
    body: LeaveLedgerCreate,
    service: LedgerServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "CREATE", "ORGANIZATION"))],
) -> LeaveLedgerResponse:
    return await service.post_ledger_entry(body, actor_employment_id=auth.employment_id)


@router.get(
    "/ledger/{employment_id}",
    response_model=list[LeaveLedgerResponse],
)
async def list_ledger(
    employment_id: int,
    service: LedgerServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF", union=True))],
    leave_type: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
) -> list[LeaveLedgerResponse]:
    enforce_owner_or_grant(auth, "leave_request", "VIEW", owner_employment_id=employment_id)
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
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF", union=True))],
) -> LeaveBalanceResponse:
    enforce_owner_or_grant(auth, "leave_request", "VIEW", owner_employment_id=employment_id)
    return await service.get_balances(employment_id)


@router.get(
    "/apply-context/{employment_id}",
    response_model=ApplyLeaveContextResponse,
)
async def get_apply_context(
    employment_id: int,
    service: LedgerServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("leave_request", "VIEW", "SELF", union=True))],
    holiday_calendar_id: int | None = Query(None),
    year: int | None = Query(None),
) -> ApplyLeaveContextResponse:
    enforce_owner_or_grant(auth, "leave_request", "VIEW", owner_employment_id=employment_id)
    return await service.get_apply_context(
        employment_id,
        holiday_calendar_id=holiday_calendar_id,
        year=year,
    )


@router.post(
    "/calculate",
    response_model=LeaveCalculateResponse,
    dependencies=[Depends(require_permission("leave_request", "VIEW", "ORGANIZATION"))],
)
async def calculate_leave_days(
    body: LeaveCalculateRequest,
    service: LedgerServiceDep,
) -> LeaveCalculateResponse:
    return await service.calculate_leave_days(body)
