"""Operational attendance routes under /workforce/attendance.

Self-service punch/break for "my day" will later move to my-work; workforce
keeps HR/ops views: days by employment, corrections, monthly summaries.
"""
from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.ip_utils import normalize_ip_address
from app.modules.workforce.attendance.schemas import (
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
    PendingCorrectionRow,
    PunchRequest,
    PunchResponse,
    TodayAttendanceListResponse,
)
from app.modules.workforce.dependencies import AttendanceServiceDep

router = APIRouter(prefix="/attendance", tags=["Workforce Attendance"])


@router.post("/punch", response_model=PunchResponse, status_code=status.HTTP_201_CREATED)
async def punch(
    body: PunchRequest,
    service: AttendanceServiceDep,
    request: Request,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> PunchResponse:
    raw_ip = request.client.host if request.client else None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        raw_ip = forwarded
    client_ip = normalize_ip_address(raw_ip) or "0.0.0.0"
    body = body.model_copy(update={"employment_id": auth.employment_id})
    return await service.punch(body, client_ip=client_ip, actor_employment_id=auth.employment_id)


@router.get(
    "/today",
    response_model=TodayAttendanceListResponse,
    dependencies=[Depends(require_permission("attendance", "VIEW", "ORGANIZATION"))],
)
async def today_list(
    service: AttendanceServiceDep,
    search: str | None = Query(None),
    status: str | None = Query(None),
) -> TodayAttendanceListResponse:
    return await service.today_list(search=search, status=status)


@router.get("/days/by-date-range", response_model=list[AttendanceDayResponse])
async def list_days_in_range(
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "ORGANIZATION"))],
    from_date: date = Query(...),
    to_date: date = Query(...),
) -> list[AttendanceDayResponse]:
    return await service.list_days_in_range(from_date, to_date)


@router.get("/days/{day_id}", response_model=AttendanceDayDetailResponse)
async def get_day(
    day_id: int,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF", union=True))],
) -> AttendanceDayDetailResponse:
    day = await service.get_day(day_id)
    enforce_owner_or_grant(auth, "attendance", "VIEW", owner_employment_id=day.employment_id)
    return day


@router.get(
    "/days/by-employment/{employment_id}",
    response_model=list[AttendanceDayResponse],
)
async def list_days(
    employment_id: int,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF", union=True))],
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
) -> list[AttendanceDayResponse]:
    enforce_owner_or_grant(auth, "attendance", "VIEW", owner_employment_id=employment_id)
    return await service.list_days(employment_id, from_date=from_date, to_date=to_date)


@router.post(
    "/corrections",
    response_model=CorrectionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_correction(
    body: CorrectionCreate,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> CorrectionResponse:
    if body.attendance_day_id is not None:
        day = await service.get_day(body.attendance_day_id)
        enforce_owner_or_grant(auth, "attendance", "CREATE", owner_employment_id=day.employment_id)
    return await service.submit_correction(body, actor_employment_id=auth.employment_id)


@router.get(
    "/corrections/pending",
    response_model=list[PendingCorrectionRow],
    dependencies=[Depends(require_permission("attendance", "VIEW", "ORGANIZATION"))],
)
async def list_pending_corrections(
    service: AttendanceServiceDep,
    limit: int = Query(50, ge=1, le=200),
) -> list[PendingCorrectionRow]:
    return await service.list_pending_corrections(limit=limit)


@router.get("/corrections/{correction_id}", response_model=CorrectionResponse)
async def get_correction(
    correction_id: int,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF", union=True))],
) -> CorrectionResponse:
    correction = await service.get_correction(correction_id)
    day = await service.get_day(correction.attendance_day_id)
    enforce_owner_or_grant(auth, "attendance", "VIEW", owner_employment_id=day.employment_id)
    return correction


@router.get(
    "/summaries/{employment_id}/{year}/{month}",
    response_model=MonthlySummaryResponse,
)
async def get_monthly_summary(
    employment_id: int,
    year: int,
    month: int,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF", union=True))],
) -> MonthlySummaryResponse:
    enforce_owner_or_grant(auth, "attendance", "VIEW", owner_employment_id=employment_id)
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
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "ORGANIZATION"))],
) -> MonthlySummaryResponse:
    return await service.rebuild_monthly_summary(
        employment_id, year, month, actor_employment_id=auth.employment_id
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
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "UPDATE", "ORGANIZATION"))],
) -> MonthlySummaryResponse:
    return await service.lock_monthly_summary(
        employment_id, year, month, actor_employment_id=auth.employment_id
    )


@router.post(
    "/summaries/{employment_id}/{year}/{month}/unlock",
    response_model=MonthlySummaryResponse,
)
async def unlock_monthly_summary(
    employment_id: int,
    year: int,
    month: int,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "UNLOCK", "ORGANIZATION"))],
) -> MonthlySummaryResponse:
    return await service.unlock_monthly_summary(
        employment_id, year, month, actor_employment_id=auth.employment_id
    )


@router.post(
    "/breaks/start",
    response_model=BreakResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_break(
    body: BreakStartRequest,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> BreakResponse:
    day = await service.get_day(body.attendance_day_id)
    enforce_owner_or_grant(auth, "attendance", "CREATE", owner_employment_id=day.employment_id)
    return await service.start_break(body, actor_employment_id=auth.employment_id)


@router.post("/breaks/{break_id}/end", response_model=BreakResponse)
async def end_break(
    break_id: int,
    body: BreakEndRequest,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> BreakResponse:
    owner_id = await service.get_break_owner_employment(break_id)
    enforce_owner_or_grant(auth, "attendance", "CREATE", owner_employment_id=owner_id)
    return await service.end_break(break_id, body, actor_employment_id=auth.employment_id)


@router.get("/policy/current", response_model=AttendancePolicyResponse)
async def get_current_attendance_policy(
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "ORGANIZATION"))],
) -> AttendancePolicyResponse:
    """Org-wide policy; was CUSTOM with no second check (any authed user)."""
    return await service.get_current_policy()


@router.post("/policies", response_model=AttendancePolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance_policy(
    body: AttendancePolicyCreate,
    service: AttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "ORGANIZATION"))],
) -> AttendancePolicyResponse:
    return await service.create_policy(body, actor_employment_id=auth.employment_id)
