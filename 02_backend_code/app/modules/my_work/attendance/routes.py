"""Self-service attendance routes under /my-work/attendance."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, Request, status

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

EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/attendance/punch",
    response_model=PunchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def my_punch(
    body: PunchRequest,
    service: MyWorkAttendanceServiceDep,
    request: Request,
    x_employment_id: EmploymentHeader = None,
) -> PunchResponse:
    client_ip = request.client.host if request.client else "0.0.0.0"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return await service.punch(
        body, client_ip=client_ip, employment_id=x_employment_id
    )


@router.post(
    "/attendance/breaks/start",
    response_model=BreakResponse,
    status_code=status.HTTP_201_CREATED,
)
async def my_start_break(
    body: BreakStartRequest,
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> BreakResponse:
    return await service.start_break(body, employment_id=x_employment_id)


@router.post("/attendance/breaks/{break_id}/end", response_model=BreakResponse)
async def my_end_break(
    break_id: int,
    body: BreakEndRequest,
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> BreakResponse:
    return await service.end_break(break_id, body, employment_id=x_employment_id)


@router.get("/attendance/days", response_model=list[AttendanceDayResponse])
async def my_days(
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
) -> list[AttendanceDayResponse]:
    return await service.list_days(
        x_employment_id, from_date=from_date, to_date=to_date
    )


@router.get("/attendance/today-info", response_model=TodayInfoResponse)
async def today_info(
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> TodayInfoResponse:
    return await service.today_info(x_employment_id)


@router.get("/attendance/week-hours", response_model=WeekHoursResponse)
async def week_hours(
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> WeekHoursResponse:
    return await service.week_hours(x_employment_id)


@router.get("/attendance/corrections", response_model=CorrectionListResponse)
async def list_corrections(
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> CorrectionListResponse:
    return await service.list_corrections(
        x_employment_id, page=page, page_size=pageSize
    )


@router.get(
    "/attendance/correction-candidates",
    response_model=list[CorrectionCandidate],
)
async def correction_candidates(
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> list[CorrectionCandidate]:
    return await service.correction_candidates(x_employment_id)


@router.get("/approvers", response_model=list[ApproverOption])
async def list_approvers(
    service: MyWorkAttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> list[ApproverOption]:
    return await service.list_approvers(x_employment_id)
