"""
FastAPI dependencies for Payroll module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.payroll.services.public_service import PayrollPublicService


def get_payroll_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PayrollPublicService:
    return PayrollPublicService(session)


PayrollServiceDep = Annotated[PayrollPublicService, Depends(get_payroll_public_service)]
