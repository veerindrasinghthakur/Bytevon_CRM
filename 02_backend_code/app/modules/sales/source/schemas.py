"""Source schemas (platforms table)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class SourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None


class SourceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: int | None


# Back-compat aliases
PlatformCreate = SourceCreate
PlatformUpdate = SourceUpdate
PlatformResponse = SourceResponse
