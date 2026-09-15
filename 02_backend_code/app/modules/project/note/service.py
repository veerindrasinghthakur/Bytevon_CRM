"""NoteService — polymorphic notes (LEAD | TASK | CLIENT only)."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import NoteReferenceType
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.project.note.models import Note
from app.modules.project.note.repository import NoteRepository
from app.modules.project.note.schemas import NoteCreate, NoteResponse, NoteUpdate

_ALLOWED_NOTE_TYPES = {
    NoteReferenceType.LEAD,
    NoteReferenceType.TASK,
    NoteReferenceType.CLIENT,
}


class NoteService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = NoteRepository(session)

    async def create(
        self,
        data: NoteCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NoteResponse:
        if data.reference_type not in _ALLOWED_NOTE_TYPES:
            raise DomainError(
                f"Unsupported note reference_type: {data.reference_type.value}"
            )
        note = Note(
            reference_type=data.reference_type,
            reference_id=data.reference_id,
            title=data.title,
            content=data.content,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(note)
        await self._commit()
        await self._audit("note.created", note.id, actor_employment_id)
        return NoteResponse.model_validate(note)

    async def get(self, note_id: int) -> NoteResponse:
        note = await self._repo.get_by_id(note_id)
        if note is None:
            raise NotFoundError("Note not found")
        return NoteResponse.model_validate(note)

    async def list(
        self, reference_type: NoteReferenceType, reference_id: int
    ) -> list[NoteResponse]:
        if reference_type not in _ALLOWED_NOTE_TYPES:
            raise DomainError(
                f"Unsupported note reference_type: {reference_type.value}"
            )
        rows = await self._repo.list_for_reference(reference_type, reference_id)
        return [NoteResponse.model_validate(r) for r in rows]

    async def update(
        self,
        note_id: int,
        data: NoteUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NoteResponse:
        note = await self._repo.get_by_id(note_id)
        if note is None:
            raise NotFoundError("Note not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(note, field, value)
        note.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("note.updated", note.id, actor_employment_id)
        return NoteResponse.model_validate(note)
