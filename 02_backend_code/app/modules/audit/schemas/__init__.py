"""Compatibility re-exports — prefer app.modules.admin.audit.schemas."""
from app.modules.admin.audit.schemas import (
    ArchiveResult,
    AuditLogCreate,
    AuditLogResponse,
)

__all__ = ["AuditLogCreate", "AuditLogResponse", "ArchiveResult"]
