"""Audit schemas (admin domain)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import AuditAction, AuditReferenceType


class MessageResponse(BaseModel):
    message: str


class AuditLogCreate(BaseModel):
    reference_type: AuditReferenceType
    reference_id: int
    action: AuditAction
    description: str = Field(..., min_length=1)
    employment_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_type: AuditReferenceType
    reference_id: int
    action: AuditAction
    description: str
    employment_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


class ArchiveResult(BaseModel):
    exported_count: int
    deleted_count: int
    storage_path: Optional[str] = None
    message: str = ""
