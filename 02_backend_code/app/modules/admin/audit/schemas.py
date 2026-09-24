"""Audit schemas (admin domain)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import AuditAction, AuditReferenceType


class MessageResponse(BaseModel):
    message: str


class AuditLogCreate(BaseModel):
    reference_type: AuditReferenceType
    reference_id: int
    action: AuditAction
    description: str = Field(..., min_length=1)
    employment_id: int | None = None
    ip_address: str | None = None
    user_agent: str | None = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference_type: AuditReferenceType
    reference_id: int
    action: AuditAction
    description: str
    employment_id: int | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime


class ArchiveResult(BaseModel):
    exported_count: int
    deleted_count: int
    storage_path: str | None = None
    message: str = ""
