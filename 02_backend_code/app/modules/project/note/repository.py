"""Note repository."""
from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NoteReferenceType
from app.core.repositories.base_repository import BaseRepository
from app.modules.project.note.models import Note


class NoteRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_id(self, note_id: int) -> Optional[Note]:
        stmt = select(Note).where(Note.id == note_id)
        return await self.scalar_one_or_none(stmt)

    async def list_for_reference(
        self,
        reference_type: NoteReferenceType,
        reference_id: int,
    ) -> Sequence[Note]:
        stmt = (
            select(Note)
            .where(
                Note.reference_type == reference_type,
                Note.reference_id == reference_id,
            )
            .order_by(Note.created_at.desc())
        )
        return await self.scalars(stmt)
