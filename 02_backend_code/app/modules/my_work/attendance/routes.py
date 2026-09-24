"""Self-service attendance routes under /my-work/attendance."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status

from app.core.authorization import AuthContext, require_permission
from app.core.ip_utils import normalize_ip_address
from app.modules.my_work.attendance.schemas import (
    ApproverOption,
    CorrectionCandidate,
    CorrectionListResponse,
    TodayInfoResponse,
    WeekHoursResponse,
)
from app.modules.my_work.dependencies import MyWorkAttendanceServiceDep
from app.modules.workforce.attendance.schemas import (
    AttendanceDayResponse,
    BreakEndRequest,
    BreakResponse,
    BreakStartRequest,
    PunchRequest,
    PunchResponse,
)

router = APIRouter(prefix="/my-work", tags=["My Work — Attendance"])


@router.get("/attendance")
async def my_attendance_list(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    include_punches: bool = Query(False),
) -> dict:
    """Paginated alias over list_days for legacy frontend callers."""
    if include_punches:
        rows = await service.list_days_detailed(auth.employment_id, from_date=from_date, to_date=to_date)
    else:
        rows = await service.list_days(auth.employment_id, from_date=from_date, to_date=to_date)
    total = len(rows)
    start = (max(1, page) - 1) * max(1, pageSize)
    return {
        "items": [r.model_dump(mode="json") for r in rows[start : start + pageSize]],
        "total": total,
        "page": page,
        "pageSize": pageSize,
    }


@router.post(
    "/attendance/punch",
    response_model=PunchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def my_punch(
    body: PunchRequest,
    service: MyWorkAttendanceServiceDep,
    request: Request,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> PunchResponse:
    raw_ip = request.client.host if request.client else None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        raw_ip = forwarded
    client_ip = normalize_ip_address(raw_ip) or "0.0.0.0"
    return await service.punch(
        body, client_ip=client_ip, employment_id=auth.employment_id
    )


@router.post(
    "/attendance/breaks/start",
    response_model=BreakResponse,
    status_code=status.HTTP_201_CREATED,
)
async def my_start_break(
    body: BreakStartRequest,
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> BreakResponse:
    return await service.start_break(body, employment_id=auth.employment_id)


@router.post("/attendance/breaks/{break_id}/end", response_model=BreakResponse)
async def my_end_break(
    break_id: int,
    body: BreakEndRequest,
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "CREATE", "SELF"))],
) -> BreakResponse:
    return await service.end_break(break_id, body, employment_id=auth.employment_id)


@router.get("/attendance/days", response_model=list[AttendanceDayResponse])
async def my_days(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
) -> list[AttendanceDayResponse]:
    return await service.list_days(
        auth.employment_id, from_date=from_date, to_date=to_date
    )


@router.get("/attendance/today-info", response_model=TodayInfoResponse)
async def today_info(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
) -> TodayInfoResponse:
    return await service.today_info(auth.employment_id)


@router.get("/attendance/week-hours", response_model=WeekHoursResponse)
async def week_hours(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
) -> WeekHoursResponse:
    return await service.week_hours(auth.employment_id)


@router.get("/attendance/corrections", response_model=CorrectionListResponse)
async def list_corrections(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> CorrectionListResponse:
    return await service.list_corrections(
        auth.employment_id, page=page, page_size=pageSize
    )


@router.get(
    "/attendance/correction-candidates",
    response_model=list[CorrectionCandidate],
)
async def correction_candidates(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
) -> list[CorrectionCandidate]:
    return await service.correction_candidates(auth.employment_id)


@router.get("/approvers", response_model=list[ApproverOption])
async def list_approvers(
    service: MyWorkAttendanceServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "VIEW", "SELF"))],
) -> list[ApproverOption]:
    return await service.list_approvers(auth.employment_id)
