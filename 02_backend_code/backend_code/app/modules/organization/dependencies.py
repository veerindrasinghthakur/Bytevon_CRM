"""
FastAPI dependencies for Organization module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.organization.services.public_service import OrganizationPublicService


def get_organization_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> OrganizationPublicService:
    return OrganizationPublicService(session)


OrganizationServiceDep = Annotated[
    OrganizationPublicService, Depends(get_organization_public_service)
]
