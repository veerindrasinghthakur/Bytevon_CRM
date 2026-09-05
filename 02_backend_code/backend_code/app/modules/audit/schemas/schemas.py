"""
Pydantic v2 schemas for Audit module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import AuditAction, AuditReferenceType


class AuditLogCreate(BaseModel):
    """Payload for AuditPublicService.log() — used by other modules after commit."""

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
    employment_id: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime


class ArchiveResult(BaseModel):
    exported_count: int
    deleted_count: int
    storage_path: Optional[str] = None
    message: str
