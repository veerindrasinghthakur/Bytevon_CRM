"""
FastAPI dependencies for Approvals module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.approvals.services.public_service import ApprovalPublicService


def get_approval_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ApprovalPublicService:
    return ApprovalPublicService(session)


ApprovalServiceDep = Annotated[
    ApprovalPublicService, Depends(get_approval_public_service)
]
