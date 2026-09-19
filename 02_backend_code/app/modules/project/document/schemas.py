"""Document schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import DocumentLinkType, DocumentStatus


class MessageResponse(BaseModel):
    message: str


class DocumentTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None


class DocumentTypeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None


class DocumentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


class DocumentCreate(BaseModel):
    """Create logical document with first version metadata (file already in storage)."""

    document_type_id: int
    title: str | None = None
    file_reference: str = Field(..., min_length=1)
    file_name: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    file_size: int = Field(..., gt=0)
    link_entity_type: DocumentLinkType | None = None
    link_entity_id: int | None = None


class DocumentVersionCreate(BaseModel):
    file_reference: str = Field(..., min_length=1)
    file_name: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    file_size: int = Field(..., gt=0)


class DocumentVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    version_number: int
    file_reference: str
    file_name: str
    mime_type: str
    file_size: int
    created_at: datetime
    changed_by: int | None


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_type_id: int
    current_version_id: int | None
    status: DocumentStatus
    title: str | None
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


class DocumentDetailResponse(DocumentResponse):
    current_version: DocumentVersionResponse | None = None
    versions: list[DocumentVersionResponse] = Field(default_factory=list)


class DocumentLinkCreate(BaseModel):
    document_id: int
    entity_type: DocumentLinkType
    entity_id: int


class DocumentLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    entity_type: DocumentLinkType
    entity_id: int
    created_at: datetime
