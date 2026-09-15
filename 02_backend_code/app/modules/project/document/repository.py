"""Document repository."""
from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db.enums import DocumentLinkType
from app.core.repositories.base_repository import BaseRepository
from app.modules.project.document.models import (
    Document,
    DocumentLink,
    DocumentType,
    DocumentVersion,
)


class DocumentRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_type_by_id(
        self, type_id: int, *, include_archived: bool = False
    ) -> Optional[DocumentType]:
        stmt = select(DocumentType).where(DocumentType.id == type_id)
        if not include_archived:
            stmt = stmt.where(DocumentType.is_archived.is_(False))
        return await self.scalar_one_or_none(stmt)

    async def list_types(self, *, include_archived: bool = False) -> Sequence[DocumentType]:
        stmt = select(DocumentType).order_by(DocumentType.name)
        if not include_archived:
            stmt = stmt.where(DocumentType.is_archived.is_(False))
        return await self.scalars(stmt)

    async def get_by_id(
        self, document_id: int, *, with_versions: bool = False
    ) -> Optional[Document]:
        stmt = select(Document).where(Document.id == document_id)
        if with_versions:
            stmt = stmt.options(selectinload(Document.versions))
        return await self.scalar_one_or_none(stmt)

    async def max_version_number(self, document_id: int) -> int:
        stmt = select(
            func.coalesce(func.max(DocumentVersion.version_number), 0)
        ).where(DocumentVersion.document_id == document_id)
        result = await self.execute(stmt)
        return int(result.scalar() or 0)

    async def list_links_for_document(self, document_id: int) -> Sequence[DocumentLink]:
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
