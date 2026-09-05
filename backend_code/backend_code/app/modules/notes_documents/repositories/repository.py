"""
NotesDocumentsRepository — domain-specific queries only.
"""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db.enums import DocumentLinkType, NoteReferenceType
from app.core.repositories.base_repository import BaseRepository
from app.modules.notes_documents.models import (
    Document,
    DocumentLink,
    DocumentType,
    DocumentVersion,
    Note,
)


class NotesDocumentsRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # Notes
    async def get_note_by_id(self, note_id: int) -> Optional[Note]:
        stmt = select(Note).where(Note.id == note_id)
        return await self.scalar_one_or_none(stmt)

    async def list_notes(
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

    # Document types
    async def get_document_type_by_id(
        self, type_id: int, *, include_archived: bool = False
    ) -> Optional[DocumentType]:
        stmt = select(DocumentType).where(DocumentType.id == type_id)
        if not include_archived:
            stmt = stmt.where(DocumentType.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_document_types(
        self, *, include_archived: bool = False
    ) -> Sequence[DocumentType]:
        stmt = select(DocumentType).order_by(DocumentType.name)
        if not include_archived:
            stmt = stmt.where(DocumentType.is_archived.is_(False))
        return await self.scalars(stmt)

    # Documents
    async def get_document_by_id(
        self, document_id: int, *, with_versions: bool = False
    ) -> Optional[Document]:
        stmt = select(Document).where(Document.id == document_id)
        if with_versions:
            stmt = stmt.options(selectinload(Document.versions))
        return await self.scalar_one_or_none(stmt)

    async def get_version_by_id(
        self, version_id: int
    ) -> Optional[DocumentVersion]:
        stmt = select(DocumentVersion).where(DocumentVersion.id == version_id)
        return await self.scalar_one_or_none(stmt)

    async def max_version_number(self, document_id: int) -> int:
        stmt = select(
            func.coalesce(func.max(DocumentVersion.version_number), 0)
        ).where(DocumentVersion.document_id == document_id)
        result = await self.execute(stmt)
        return int(result.scalar() or 0)

    async def list_versions(
        self, document_id: int
    ) -> Sequence[DocumentVersion]:
        stmt = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
        )
        return await self.scalars(stmt)

    # Links
    async def list_links_for_document(
        self, document_id: int
    ) -> Sequence[DocumentLink]:
        stmt = select(DocumentLink).where(DocumentLink.document_id == document_id)
        return await self.scalars(stmt)

    async def list_links_for_entity(
        self, entity_type: DocumentLinkType, entity_id: int
    ) -> Sequence[DocumentLink]:
        stmt = select(DocumentLink).where(
            DocumentLink.entity_type == entity_type,
            DocumentLink.entity_id == entity_id,
        )
        return await self.scalars(stmt)

    async def get_link(
        self,
        document_id: int,
        entity_type: DocumentLinkType,
        entity_id: int,
    ) -> Optional[DocumentLink]:
        stmt = select(DocumentLink).where(
            DocumentLink.document_id == document_id,
            DocumentLink.entity_type == entity_type,
            DocumentLink.entity_id == entity_id,
        )
        return await self.scalar_one_or_none(stmt)
