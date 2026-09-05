"""
FastAPI dependencies for Attendance module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.attendance.services.public_service import AttendancePublicService


def get_attendance_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AttendancePublicService:
    return AttendancePublicService(session)


AttendanceServiceDep = Annotated[
    AttendancePublicService, Depends(get_attendance_public_service)
]
