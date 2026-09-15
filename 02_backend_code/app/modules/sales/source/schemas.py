"""Source schemas (platforms table)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class SourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None


class SourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int]


# Back-compat aliases
PlatformCreate = SourceCreate
PlatformUpdate = SourceUpdate
PlatformResponse = SourceResponse
