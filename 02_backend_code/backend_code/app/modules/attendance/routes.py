"""
Attendance HTTP routes.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, Request, status

from app.modules.attendance.dependencies import AttendanceServiceDep
from app.modules.attendance.schemas.schemas import (
    AttendanceDayDetailResponse,
    AttendanceDayResponse,
    AttendancePolicyCreate,
    AttendancePolicyResponse,
    BreakEndRequest,
    BreakResponse,
    BreakStartRequest,
    CorrectionCreate,
    CorrectionResponse,
    MonthlySummaryResponse,
    PunchRequest,
    PunchResponse,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Punch
# ---------------------------------------------------------------------------

@router.post(
    "/punch",
    response_model=PunchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def punch(
    body: PunchRequest,
    service: AttendanceServiceDep,
    request: Request,
    actor: ActorHeader = None,
) -> PunchResponse:
    client_ip = request.client.host if request.client else "0.0.0.0"
    # Prefer X-Forwarded-For when behind proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return await service.punch(
        body, client_ip=client_ip, actor_employment_id=actor
    )


# ---------------------------------------------------------------------------
# Days
# ---------------------------------------------------------------------------

@router.get("/days/{day_id}", response_model=AttendanceDayDetailResponse)
async def get_day(
    day_id: int,
    service: AttendanceServiceDep,
) -> AttendanceDayDetailResponse:
    return await service.get_day(day_id)


@router.get(
    "/days/by-employment/{employment_id}",
    response_model=list[AttendanceDayResponse],
)
async def list_days(
    employment_id: int,
    service: AttendanceServiceDep,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
) -> list[AttendanceDayResponse]:
    return await service.list_days(
        employment_id, from_date=from_date, to_date=to_date
    )


# ---------------------------------------------------------------------------
# Corrections
# ---------------------------------------------------------------------------

@router.post(
    "/corrections",
    response_model=CorrectionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_correction(
    body: CorrectionCreate,
    service: AttendanceServiceDep,
    actor: Annotated[int, Header(alias="X-Employment-Id")],
) -> CorrectionResponse:
    return await service.submit_correction(body, actor_employment_id=actor)


@router.get("/corrections/{correction_id}", response_model=CorrectionResponse)
async def get_correction(
    correction_id: int,
    service: AttendanceServiceDep,
) -> CorrectionResponse:
    return await service.get_correction(correction_id)


# ---------------------------------------------------------------------------
# Policies
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Monthly summaries
# ---------------------------------------------------------------------------

@router.get(
    "/summaries/{employment_id}/{year}/{month}",
    response_model=MonthlySummaryResponse,
)
async def get_monthly_summary(
    employment_id: int,
    year: int,
    month: int,
    service: AttendanceServiceDep,
) -> MonthlySummaryResponse:
    return await service.get_monthly_summary(employment_id, year, month)


@router.post(
    "/summaries/{employment_id}/{year}/{month}/rebuild",
    response_model=MonthlySummaryResponse,
)
async def rebuild_monthly_summary(
    employment_id: int,
    year: int,
    month: int,
    service: AttendanceServiceDep,
    actor: ActorHeader = None,
) -> MonthlySummaryResponse:
    return await service.rebuild_monthly_summary(
        employment_id, year, month, actor_employment_id=actor
    )


@router.post(
    "/summaries/{employment_id}/{year}/{month}/lock",
    response_model=MonthlySummaryResponse,
)
async def lock_monthly_summary(
    employment_id: int,
    year: int,
    month: int,
    service: AttendanceServiceDep,
    actor: ActorHeader = None,
) -> MonthlySummaryResponse:
    return await service.lock_monthly_summary(
        employment_id, year, month, actor_employment_id=actor
    )


# ---------------------------------------------------------------------------
# Breaks
# ---------------------------------------------------------------------------

@router.post(
    "/breaks/start",
    response_model=BreakResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_break(
    body: BreakStartRequest,
    service: AttendanceServiceDep,
    actor: ActorHeader = None,
) -> BreakResponse:
    return await service.start_break(body, actor_employment_id=actor)


@router.post(
    "/breaks/{break_id}/end",
    response_model=BreakResponse,
)
async def end_break(
    break_id: int,
    body: BreakEndRequest,
    service: AttendanceServiceDep,
    actor: ActorHeader = None,
) -> BreakResponse:
    return await service.end_break(break_id, body, actor_employment_id=actor)
