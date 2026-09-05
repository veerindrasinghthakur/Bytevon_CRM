"""
FastAPI dependencies for Sales module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.sales.services.public_service import SalesPublicService


def get_sales_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SalesPublicService:
    return SalesPublicService(session)


SalesServiceDep = Annotated[SalesPublicService, Depends(get_sales_public_service)]
