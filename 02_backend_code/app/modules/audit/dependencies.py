"""
FastAPI dependencies for Audit module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.audit.services.public_service import AuditPublicService


def get_audit_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuditPublicService:
    return AuditPublicService(session)


AuditServiceDep = Annotated[AuditPublicService, Depends(get_audit_public_service)]
