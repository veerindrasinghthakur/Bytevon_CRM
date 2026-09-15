"""FastAPI dependencies for RBAC module."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.rbac.service import RBACService


def get_rbac_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RBACService:
    return RBACService(session)


RBACServiceDep = Annotated[RBACService, Depends(get_rbac_service)]
