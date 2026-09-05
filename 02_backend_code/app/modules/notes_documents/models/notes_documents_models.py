"""
Notes & Documents ORM models.

Tables: notes, document_types, documents, document_versions, document_links

Polymorphic notes: type + id (LEAD | TASK | CLIENT only).
Documents: external storage reference; unlimited versions; multi-entity links.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    ArchiveMixin,
    Base,
    CreatedAtMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import DocumentLinkType, DocumentStatus, NoteReferenceType


class Note(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "notes"

    reference_type: Mapped[NoteReferenceType] = mapped_column(nullable=False, index=True)
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class DocumentType(Base, IdentityMixin, ArchiveMixin, TimestampMixin):
    __tablename__ = "document_types"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class Document(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "documents"

    document_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("document_types.id"), nullable=False, index=True
    )
    # Set after first version is created (avoids circular insert)
    current_version_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("document_versions.id", use_alter=True), nullable=True
    )
    status: Mapped[DocumentStatus] = mapped_column(
        nullable=False, default=DocumentStatus.ACTIVE
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    versions: Mapped[List["DocumentVersion"]] = relationship(
        "DocumentVersion",
        back_populates="document",
        foreign_keys="DocumentVersion.document_id",
        cascade="all, delete-orphan",
    )
    links: Mapped[List["DocumentLink"]] = relationship(
        "DocumentLink",
        back_populates="document",
        cascade="all, delete-orphan",
    )


class DocumentVersion(Base, IdentityMixin, CreatedAtMixin):
    """Append-only version history. Physical file lives externally."""

    __tablename__ = "document_versions"

    document_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("documents.id"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    file_reference: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="versions",
        foreign_keys=[document_id],
    )


class DocumentLink(Base, IdentityMixin, CreatedAtMixin):
    """Polymorphic link between a document and a business entity."""

    __tablename__ = "document_links"

    document_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("documents.id"), nullable=False, index=True
    )
    entity_type: Mapped[DocumentLinkType] = mapped_column(nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    document: Mapped["Document"] = relationship("Document", back_populates="links")
