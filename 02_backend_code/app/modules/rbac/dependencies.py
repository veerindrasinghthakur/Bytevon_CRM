"""
FastAPI dependencies for RBAC module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.rbac.services.public_service import RBACPublicService


def get_rbac_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RBACPublicService:
    return RBACPublicService(session)


RBACServiceDep = Annotated[RBACPublicService, Depends(get_rbac_public_service)]
