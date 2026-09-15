"""Compatibility dependencies — prefer app.modules.admin.dependencies.AuditServiceDep."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.admin.audit.service import AuditService


def get_audit_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuditService:
    return AuditService(session)


AuditServiceDep = Annotated[AuditService, Depends(get_audit_public_service)]
