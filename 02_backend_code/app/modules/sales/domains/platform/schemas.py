"""Platform (lead source) schemas."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class MessageResponse(BaseModel):
    message: str

class PlatformCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None

class PlatformUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None

class PlatformResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
    changed_by: Optional[int] = None
