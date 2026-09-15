"""Position schemas (admin domain)."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class MessageResponse(BaseModel):
    message: str

class PositionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)

class PositionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)

class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
