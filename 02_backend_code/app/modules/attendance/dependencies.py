"""Shim — prefer app.modules.workforce.dependencies.AttendanceServiceDep."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.workforce.attendance.service import AttendanceService


def get_attendance_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AttendanceService:
    return AttendanceService(session)


AttendanceServiceDep = Annotated[AttendanceService, Depends(get_attendance_public_service)]
