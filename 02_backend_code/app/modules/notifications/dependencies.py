"""Notifications domain dependencies."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.notifications.center.service import CenterService
from app.modules.notifications.compose.service import ComposeService
from app.modules.notifications.preference.service import PreferenceService
from app.modules.notifications.sent.service import SentService
from app.modules.notifications.settings.service import SettingsService
from app.modules.notifications.template.service import TemplateService


def get_center_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CenterService:
    return CenterService(session)


def get_compose_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ComposeService:
    return ComposeService(session)


def get_template_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TemplateService:
    return TemplateService(session)


def get_settings_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SettingsService:
    return SettingsService(session)


def get_preference_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PreferenceService:
    return PreferenceService(session)


def get_sent_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SentService:
    return SentService(session)


CenterServiceDep = Annotated[CenterService, Depends(get_center_service)]
ComposeServiceDep = Annotated[ComposeService, Depends(get_compose_service)]
TemplateServiceDep = Annotated[TemplateService, Depends(get_template_service)]
SettingsServiceDep = Annotated[SettingsService, Depends(get_settings_service)]
PreferenceServiceDep = Annotated[PreferenceService, Depends(get_preference_service)]
SentServiceDep = Annotated[SentService, Depends(get_sent_service)]

# Back-compat for older imports that expected a single dep
NotificationServiceDep = ComposeServiceDep
