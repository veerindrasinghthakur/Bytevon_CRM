"""
NotesDocumentsPublicService — only public entry for Notes & Documents.

- Notes: polymorphic LEAD | TASK | CLIENT only.
- Documents: metadata + external file_reference; versions append-only.
- Links: polymorphic multi-entity association.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import DocumentLinkType, DocumentStatus, NoteReferenceType
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.notes_documents.models import (
    Document,
    DocumentLink,
    DocumentType,
    DocumentVersion,
    Note,
)
from app.modules.notes_documents.repositories.repository import NotesDocumentsRepository
from app.modules.notes_documents.schemas.schemas import (
    DocumentCreate,
    DocumentDetailResponse,
    DocumentLinkCreate,
    DocumentLinkResponse,
    DocumentResponse,
    DocumentTypeCreate,
    DocumentTypeResponse,
    DocumentTypeUpdate,
    DocumentVersionCreate,
    DocumentVersionResponse,
    MessageResponse,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
)

logger = logging.getLogger(__name__)

_ALLOWED_NOTE_TYPES = {
    NoteReferenceType.LEAD,
    NoteReferenceType.TASK,
    NoteReferenceType.CLIENT,
}


class NotesDocumentsPublicService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = NotesDocumentsRepository(session)

    # ==================================================================
    # Notes
    # ==================================================================

    async def create_note(
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

    async def get_note(self, note_id: int) -> NoteResponse:
        note = await self._repo.get_note_by_id(note_id)
        if note is None:
            raise NotFoundError("Note not found")
        return NoteResponse.model_validate(note)

    async def list_notes(
        self, reference_type: NoteReferenceType, reference_id: int
    ) -> list[NoteResponse]:
        if reference_type not in _ALLOWED_NOTE_TYPES:
            raise DomainError(
                f"Unsupported note reference_type: {reference_type.value}"
            )
        rows = await self._repo.list_notes(reference_type, reference_id)
        return [NoteResponse.model_validate(r) for r in rows]

    async def update_note(
        self,
        note_id: int,
        data: NoteUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> NoteResponse:
        note = await self._repo.get_note_by_id(note_id)
        if note is None:
            raise NotFoundError("Note not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(note, field, value)
        note.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("note.updated", note.id, actor_employment_id)
        return NoteResponse.model_validate(note)

    # ==================================================================
    # Document types
    # ==================================================================

    async def create_document_type(
        self,
        data: DocumentTypeCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DocumentTypeResponse:
        dt = DocumentType(
            name=data.name,
            description=data.description,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(dt)
        await self._commit()
        return DocumentTypeResponse.model_validate(dt)

    async def list_document_types(
        self, *, include_archived: bool = False
    ) -> list[DocumentTypeResponse]:
        rows = await self._repo.list_document_types(include_archived=include_archived)
        return [DocumentTypeResponse.model_validate(r) for r in rows]

    async def update_document_type(
        self,
        type_id: int,
        data: DocumentTypeUpdate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DocumentTypeResponse:
        dt = await self._repo.get_document_type_by_id(type_id)
        if dt is None:
            raise NotFoundError("Document type not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(dt, field, value)
        dt.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        return DocumentTypeResponse.model_validate(dt)

    async def archive_document_type(
        self,
        type_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        dt = await self._repo.get_document_type_by_id(type_id)
        if dt is None:
            raise NotFoundError("Document type not found")
        if dt.is_archived:
            raise DomainError("Document type already archived")
        now = datetime.now(timezone.utc)
        dt.is_archived = True
        dt.archived_at = now
        dt.archived_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        return MessageResponse(message="Document type archived")

    # ==================================================================
    # Documents
    # ==================================================================

    async def create_document(
        self,
        data: DocumentCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DocumentDetailResponse:
        dtype = await self._repo.get_document_type_by_id(data.document_type_id)
        if dtype is None:
            raise NotFoundError("Document type not found")

        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        doc = Document(
            document_type_id=data.document_type_id,
            title=data.title or data.file_name,
            status=DocumentStatus.ACTIVE,
            changed_by=actor,
        )
        await self._repo.add(doc)
        await self._flush()

        version = DocumentVersion(
            document_id=doc.id,
            version_number=1,
            file_reference=data.file_reference,
            file_name=data.file_name,
            mime_type=data.mime_type,
            file_size=data.file_size,
            changed_by=actor,
        )
        await self._repo.add(version)
        await self._flush()
        doc.current_version_id = version.id

        if data.link_entity_type is not None and data.link_entity_id is not None:
            link = DocumentLink(
                document_id=doc.id,
                entity_type=data.link_entity_type,
                entity_id=data.link_entity_id,
            )
            await self._repo.add(link)

        await self._commit()
        await self._audit("document.created", doc.id, actor_employment_id)
        return DocumentDetailResponse(
            **DocumentResponse.model_validate(doc).model_dump(),
            current_version=DocumentVersionResponse.model_validate(version),
            versions=[DocumentVersionResponse.model_validate(version)],
        )

    async def add_version(
        self,
        document_id: int,
        data: DocumentVersionCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DocumentVersionResponse:
        doc = await self._repo.get_document_by_id(document_id)
        if doc is None:
            raise NotFoundError("Document not found")
        if doc.status == DocumentStatus.ARCHIVED:
            raise DomainError("Cannot version an archived document")

        next_num = (await self._repo.max_version_number(document_id)) + 1
        actor = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        version = DocumentVersion(
            document_id=document_id,
            version_number=next_num,
            file_reference=data.file_reference,
            file_name=data.file_name,
            mime_type=data.mime_type,
            file_size=data.file_size,
            changed_by=actor,
        )
        await self._repo.add(version)
        await self._flush()
        doc.current_version_id = version.id
        doc.changed_by = actor
        await self._commit()
        await self._audit("document.version_added", version.id, actor_employment_id)
        return DocumentVersionResponse.model_validate(version)

    async def get_document(self, document_id: int) -> DocumentDetailResponse:
        doc = await self._repo.get_document_by_id(document_id, with_versions=True)
        if doc is None:
            raise NotFoundError("Document not found")
        versions = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
        current = None
        if doc.current_version_id:
            current = next(
                (v for v in versions if v.id == doc.current_version_id), None
            )
        return DocumentDetailResponse(
            **DocumentResponse.model_validate(doc).model_dump(),
            current_version=(
                DocumentVersionResponse.model_validate(current) if current else None
            ),
            versions=[DocumentVersionResponse.model_validate(v) for v in versions],
        )

    async def archive_document(
        self,
        document_id: int,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> MessageResponse:
        doc = await self._repo.get_document_by_id(document_id)
        if doc is None:
            raise NotFoundError("Document not found")
        if doc.status == DocumentStatus.ARCHIVED:
            raise DomainError("Document already archived")
        doc.status = DocumentStatus.ARCHIVED
        doc.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("document.archived", doc.id, actor_employment_id)
        return MessageResponse(message="Document archived")

    # ==================================================================
    # Links
    # ==================================================================

    async def link_document(
        self,
        data: DocumentLinkCreate,
        *,
        actor_employment_id: Optional[int] = None,
    ) -> DocumentLinkResponse:
        doc = await self._repo.get_document_by_id(data.document_id)
        if doc is None:
            raise NotFoundError("Document not found")
        existing = await self._repo.get_link(
            data.document_id, data.entity_type, data.entity_id
        )
        if existing:
            raise ConflictError("Document already linked to this entity")
        link = DocumentLink(
            document_id=data.document_id,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
        )
        await self._repo.add(link)
        await self._commit()
        await self._audit("document.linked", link.id, actor_employment_id)
        return DocumentLinkResponse.model_validate(link)

    async def list_links_for_entity(
        self, entity_type: DocumentLinkType, entity_id: int
    ) -> list[DocumentLinkResponse]:
        rows = await self._repo.list_links_for_entity(entity_type, entity_id)
        return [DocumentLinkResponse.model_validate(r) for r in rows]

    async def list_links_for_document(
        self, document_id: int
    ) -> list[DocumentLinkResponse]:
        doc = await self._repo.get_document_by_id(document_id)
        if doc is None:
            raise NotFoundError("Document not found")
        rows = await self._repo.list_links_for_document(document_id)
        return [DocumentLinkResponse.model_validate(r) for r in rows]

    # ==================================================================
    # Helpers
    # ==================================================================

