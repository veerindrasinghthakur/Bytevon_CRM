"""Note schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import NoteReferenceType


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
