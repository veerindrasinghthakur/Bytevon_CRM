"""Pydantic v2 schemas for Notes & Documents module."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import DocumentLinkType, DocumentStatus, NoteReferenceType


class MessageResponse(BaseModel):
    message: str


class NoteCreate(BaseModel):
    reference_type: NoteReferenceType
    reference_id: int
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_type: NoteReferenceType
    reference_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class DocumentTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None


class DocumentTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None


class DocumentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class DocumentCreate(BaseModel):
    document_type_id: int
    title: Optional[str] = None
    file_reference: str = Field(..., min_length=1)
    file_name: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=1, max_length=100)
    file_size: int = Field(..., gt=0)
    link_entity_type: Optional[DocumentLinkType] = None
    link_entity_id: Optional[int] = None


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
    changed_by: Optional[int]


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_type_id: int
    current_version_id: Optional[int]
    status: DocumentStatus
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


class DocumentDetailResponse(DocumentResponse):
    current_version: Optional[DocumentVersionResponse] = None
    versions: List[DocumentVersionResponse] = Field(default_factory=list)


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
