"""My-work HTTP facade — self-service attendance + profile."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query, Request, status

from app.core.db.enums import PunchType
from app.modules.auth.dependencies import AuthenticationServiceDep
from app.modules.workforce.dependencies import AttendanceServiceDep
from app.modules.workforce.attendance.schemas import (
    AttendanceDayDetailResponse,
    AttendanceDayResponse,
    BreakEndRequest,
    BreakResponse,
    BreakStartRequest,
    PunchRequest,
    PunchResponse,
)

router = APIRouter(prefix="/my-work", tags=["My Work"])
profile_router = APIRouter(prefix="/profile", tags=["My Work — Profile"])

EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]
LoginHeader = Annotated[Optional[int], Header(alias="X-Login-Id")]


@router.post("/attendance/punch", response_model=PunchResponse, status_code=status.HTTP_201_CREATED)
async def my_punch(
    body: PunchRequest,
    service: AttendanceServiceDep,
    request: Request,
    x_employment_id: EmploymentHeader = None,
) -> PunchResponse:
    if x_employment_id is not None:
        body = body.model_copy(update={"employment_id": x_employment_id})
    client_ip = request.client.host if request.client else "0.0.0.0"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return await service.punch(body, client_ip=client_ip, actor_employment_id=x_employment_id)


@router.post("/attendance/breaks/start", response_model=BreakResponse, status_code=status.HTTP_201_CREATED)
async def my_start_break(
    body: BreakStartRequest,
    service: AttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> BreakResponse:
    return await service.start_break(body, actor_employment_id=x_employment_id)


@router.post("/attendance/breaks/{break_id}/end", response_model=BreakResponse)
async def my_end_break(
    break_id: int,
    body: BreakEndRequest,
    service: AttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> BreakResponse:
    return await service.end_break(break_id, body, actor_employment_id=x_employment_id)


@router.get("/attendance/days", response_model=list[AttendanceDayResponse])
async def my_days(
    service: AttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
) -> list[AttendanceDayResponse]:
    if x_employment_id is None:
        return []
    return await service.list_days(x_employment_id, from_date=from_date, to_date=to_date)


@router.get("/attendance/today-info")
async def today_info(
    service: AttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
    if x_employment_id is None:
        return {"employmentId": None, "todayLabel": "Today", "shift": "—", "status": "UNKNOWN", "checkIn": None, "checkOut": None, "workedMinutes": 0, "breakMinutes": 0}
    today = date.today()
    days = await service.list_days(x_employment_id, from_date=today, to_date=today)
    if not days:
        return {"employmentId": x_employment_id, "todayLabel": "Today", "shift": "—", "status": "NOT_STARTED", "checkIn": None, "checkOut": None, "workedMinutes": 0, "breakMinutes": 0}
    day = days[0]
    detail: AttendanceDayDetailResponse = await service.get_day(day.id)
    check_in = None
    check_out = None
    for p in detail.punches:
        if p.punch_type == PunchType.CHECK_IN and check_in is None:
            check_in = p.punch_time.isoformat()
        if p.punch_type == PunchType.CHECK_OUT:
            check_out = p.punch_time.isoformat()
    worked = int(float(day.working_hours or 0) * 60)
    return {"employmentId": x_employment_id, "todayLabel": "Today", "shift": str(day.shift_id) if day.shift_id else "—", "status": day.status.value if hasattr(day.status, "value") else str(day.status), "checkIn": check_in, "checkOut": check_out, "workedMinutes": worked, "breakMinutes": 0, "dayId": day.id}


@router.get("/attendance/week-hours")
async def week_hours(
    service: AttendanceServiceDep,
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
    if x_employment_id is None:
        return {"employmentId": None, "days": [], "totalMinutes": 0}
    today = date.today()
    start = date.fromordinal(today.toordinal() - today.weekday())
    days = await service.list_days(x_employment_id, from_date=start, to_date=today)
    out_days = []
    total = 0
    for d in days:
        mins = int(float(d.working_hours or 0) * 60)
        total += mins
        out_days.append({"date": d.attendance_date.isoformat(), "status": d.status.value if hasattr(d.status, "value") else str(d.status), "minutes": mins})
    return {"employmentId": x_employment_id, "days": out_days, "totalMinutes": total}


@router.get("/attendance/corrections")
async def list_corrections(
    x_employment_id: EmploymentHeader = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


@router.get("/attendance/correction-candidates")
async def correction_candidates(x_employment_id: EmploymentHeader = None) -> list[dict[str, Any]]:
    return []


@router.get("/approvers")
async def list_approvers(x_employment_id: EmploymentHeader = None) -> list[dict[str, Any]]:
    return []


@profile_router.get("/me")
async def get_me(x_login_id: LoginHeader = None, x_employment_id: EmploymentHeader = None) -> dict[str, Any]:
    return {"loginId": x_login_id, "employmentId": x_employment_id, "name": "", "email": "", "avatarUrl": None, "title": "", "department": "", "phone": ""}


@profile_router.patch("/me")
async def update_me(body: dict[str, Any]) -> dict[str, Any]:
    return {"ok": True, **body}


@profile_router.get("/activity")
async def profile_activity(limit: int = Query(20, ge=1, le=100)) -> dict[str, Any]:
    return {"items": [], "total": 0, "limit": limit}


@profile_router.get("/sessions")
async def profile_sessions(service: AuthenticationServiceDep, x_login_id: Annotated[int, Header(alias="X-Login-Id")]) -> list[Any]:
    return await service.list_sessions(x_login_id)
