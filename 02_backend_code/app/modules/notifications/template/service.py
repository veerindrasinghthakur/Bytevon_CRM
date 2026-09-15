"""TemplateService — CRUD for notification templates."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.models import NotificationTemplate
from app.modules.notifications.template.repository import TemplateRepository
from app.modules.notifications.template.schemas import (
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
)


class TemplateService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = TemplateRepository(session)

    async def create_template(
        self,
        data: NotificationTemplateCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NotificationTemplateResponse:
        existing = await self._repo.get_template_by_code(data.code)
        if existing:
            raise ConflictError(f"Template code '{data.code}' already exists")
        tpl = NotificationTemplate(
            code=data.code,
            title_template=data.title_template,
            body_template=data.body_template,
            variables=data.variables,
            is_active=data.is_active,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(tpl)
        await self._commit()
        return NotificationTemplateResponse.model_validate(tpl)

    async def update_template(
        self,
        template_id: int,
        data: NotificationTemplateUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NotificationTemplateResponse:
        tpl = await self._repo.get_template_by_id(template_id)
        if tpl is None:
            raise NotFoundError("Template not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(tpl, field, value)
        tpl.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        return NotificationTemplateResponse.model_validate(tpl)

    async def list_templates(
        self, *, active_only: bool = False
    ) -> list[NotificationTemplateResponse]:
        rows = await self._repo.list_templates(active_only=active_only)
        return [NotificationTemplateResponse.model_validate(r) for r in rows]

    async def get_template(self, template_id: int) -> NotificationTemplateResponse:
        tpl = await self._repo.get_template_by_id(template_id)
        if tpl is None:
            raise NotFoundError("Template not found")
        return NotificationTemplateResponse.model_validate(tpl)
