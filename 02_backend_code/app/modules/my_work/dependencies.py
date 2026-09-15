"""My-work domain dependencies."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.my_work.attendance.service import MyWorkAttendanceService
from app.modules.my_work.profile.service import ProfileService


def get_my_work_attendance_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MyWorkAttendanceService:
    return MyWorkAttendanceService(session)


def get_profile_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProfileService:
    return ProfileService(session)


MyWorkAttendanceServiceDep = Annotated[
    MyWorkAttendanceService, Depends(get_my_work_attendance_service)
]
ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
