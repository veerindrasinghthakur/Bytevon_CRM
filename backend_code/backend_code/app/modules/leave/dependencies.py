"""
FastAPI dependencies for Leave module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.leave.services.public_service import LeavePublicService


def get_leave_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeavePublicService:
    return LeavePublicService(session)


LeaveServiceDep = Annotated[LeavePublicService, Depends(get_leave_public_service)]
