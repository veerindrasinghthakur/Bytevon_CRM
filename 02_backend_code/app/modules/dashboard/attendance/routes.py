"""Scope-based GET /dashboard/attendance (default SELF, drill-down via CUSTOM)."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.database import get_db_session
from app.modules.dashboard.attendance.schemas import DashboardAttendanceResponse
from app.modules.dashboard.attendance.service import DashboardAttendanceService

router = APIRouter(tags=["Dashboard — Attendance"])


def get_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardAttendanceService:
    return DashboardAttendanceService(session)


ServiceDep = Annotated[DashboardAttendanceService, Depends(get_service)]


@router.get("/attendance", response_model=DashboardAttendanceResponse)
async def dashboard_attendance(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "CUSTOM"))],
    employment_id: int | None = Query(None),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    year: int | None = Query(None),
    month: int | None = Query(None, ge=1, le=12),
) -> DashboardAttendanceResponse:
    target = employment_id or auth.employment_id
    enforce_owner_or_grant(auth, "attendance", "VIEW", owner_employment_id=target)
    scope = "SELF" if target == auth.employment_id else "DRILL_DOWN"
    return await service.get_attendance(
        target, from_date=from_date, to_date=to_date, year=year, month=month, scope=scope
    )
