"""
FastAPI dependencies for Employment module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.employment.services.public_service import EmploymentPublicService


def get_employment_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EmploymentPublicService:
    return EmploymentPublicService(session)


EmploymentServiceDep = Annotated[
    EmploymentPublicService, Depends(get_employment_public_service)
]
