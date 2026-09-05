"""
FastAPI dependencies for Notifications module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.notifications.services.public_service import NotificationPublicService


def get_notification_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotificationPublicService:
    return NotificationPublicService(session)


NotificationServiceDep = Annotated[
    NotificationPublicService, Depends(get_notification_public_service)
]
