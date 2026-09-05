"""
Leave HTTP routes.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import LeaveRequestStatus, LeaveType
from app.modules.leave.dependencies import LeaveServiceDep
from app.modules.leave.schemas.schemas import (
    ApplyLeaveContextResponse,
    LeaveBalanceResponse,
    LeaveCalculateRequest,
    LeaveCalculateResponse,
    LeaveLedgerCreate,
    LeaveLedgerResponse,
    LeavePolicyCreate,
    LeavePolicyResponse,
    LeaveRequestCreate,
    LeaveRequestResponse,
    MessageResponse,
)

router = APIRouter(prefix="/leave", tags=["Leave"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Policies
# ---------------------------------------------------------------------------

@router.post(
    "/policies",
    response_model=LeavePolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_policy(
    body: LeavePolicyCreate,
    service: LeaveServiceDep,
    actor: ActorHeader = None,
) -> LeavePolicyResponse:
    return await service.create_policy(body, actor_employment_id=actor)


@router.get("/policies", response_model=list[LeavePolicyResponse])
async def list_policies(
    service: LeaveServiceDep,
    leave_type: Optional[LeaveType] = Query(None),
) -> list[LeavePolicyResponse]:
    return await service.list_policies(leave_type=leave_type)


@router.get("/policies/current/{leave_type}", response_model=LeavePolicyResponse)
async def get_current_policy(
    leave_type: LeaveType,
    service: LeaveServiceDep,
    as_of: Optional[date] = Query(None),
) -> LeavePolicyResponse:
    return await service.get_current_policy(leave_type, as_of=as_of)


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

@router.post(
    "/requests",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_request(
    body: LeaveRequestCreate,
    service: LeaveServiceDep,
    actor: ActorHeader = None,
) -> LeaveRequestResponse:
    return await service.submit_request(body, actor_employment_id=actor)


@router.get("/requests", response_model=list[LeaveRequestResponse])
async def list_requests(
    service: LeaveServiceDep,
    employment_id: Optional[int] = Query(None),
    status_filter: Optional[LeaveRequestStatus] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeaveRequestResponse]:
    return await service.list_requests(
        employment_id=employment_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )


@router.get("/requests/{request_id}", response_model=LeaveRequestResponse)
async def get_request(
    request_id: int,
    service: LeaveServiceDep,
) -> LeaveRequestResponse:
    return await service.get_request(request_id)


@router.post(
    "/requests/{request_id}/cancel",
    response_model=LeaveRequestResponse,
)
async def cancel_request(
    request_id: int,
    service: LeaveServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> LeaveRequestResponse:
    return await service.cancel_request(request_id, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Ledger / balance
# ---------------------------------------------------------------------------

@router.post(
    "/ledger",
    response_model=LeaveLedgerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_ledger_entry(
    body: LeaveLedgerCreate,
    service: LeaveServiceDep,
    actor: ActorHeader = None,
) -> LeaveLedgerResponse:
    return await service.post_ledger_entry(body, actor_employment_id=actor)


@router.get(
    "/ledger/{employment_id}",
    response_model=list[LeaveLedgerResponse],
)
async def list_ledger(
    employment_id: int,
    service: LeaveServiceDep,
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
    service: LeaveServiceDep,
) -> LeaveBalanceResponse:
    return await service.get_balances(employment_id)


# ---------------------------------------------------------------------------
# Apply Leave page — context + working-day calculation
# ---------------------------------------------------------------------------


@router.get(
    "/apply-context/{employment_id}",
    response_model=ApplyLeaveContextResponse,
)
async def get_apply_context(
    employment_id: int,
    service: LeaveServiceDep,
    holiday_calendar_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
) -> ApplyLeaveContextResponse:
    """
    Bootstrap Apply Leave: holidays, leave types, balances in one response.
    Client should not hardcode holidays or recompute policy balances locally.
    """
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
    service: LeaveServiceDep,
) -> LeaveCalculateResponse:
    """Working-day cost (excl. weekends/holidays) + projected balance after request."""
    return await service.calculate_leave_days(body)
