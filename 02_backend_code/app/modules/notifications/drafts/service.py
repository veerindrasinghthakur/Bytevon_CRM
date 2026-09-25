"""Notification draft CRUD (owner-scoped)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.exception import NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.drafts.schemas import (
    NotificationDraftCreate,
    NotificationDraftResponse,
    NotificationDraftUpdate,
)
from app.modules.notifications.models import NotificationDraft


class DraftService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_drafts(self, owner_employment_id: int) -> list[NotificationDraftResponse]:
        rows = (
            await self._session.execute(
                select(NotificationDraft)
                .where(NotificationDraft.owner_employment_id == owner_employment_id)
                .order_by(NotificationDraft.updated_at.desc())
            )
        ).scalars().all()
        return [NotificationDraftResponse.model_validate(r) for r in rows]

    async def _owned(self, draft_id: int, owner_employment_id: int) -> NotificationDraft:
        row = await self._session.get(NotificationDraft, draft_id)
        if row is None or int(row.owner_employment_id) != int(owner_employment_id):
            raise NotFoundError("Draft not found")
        return row

    async def create_draft(
        self, data: NotificationDraftCreate, *, owner_employment_id: int
    ) -> NotificationDraftResponse:
        row = NotificationDraft(
            owner_employment_id=owner_employment_id,
            **data.model_dump(),
        )
        self._session.add(row)
        await self._commit()
        await self._session.refresh(row)
        return NotificationDraftResponse.model_validate(row)

    async def update_draft(
        self, draft_id: int, data: NotificationDraftUpdate, *, owner_employment_id: int
    ) -> NotificationDraftResponse:
        row = await self._owned(draft_id, owner_employment_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(row, key, value)
        await self._commit()
        await self._session.refresh(row)
        return NotificationDraftResponse.model_validate(row)

    async def delete_draft(self, draft_id: int, *, owner_employment_id: int) -> None:
        row = await self._owned(draft_id, owner_employment_id)
        await self._session.delete(row)
        await self._commit()
