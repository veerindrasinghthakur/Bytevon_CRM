"""Compatibility re-exports — prefer app.modules.admin.audit.schemas."""
from app.modules.admin.audit.schemas import (
    ArchiveResult,
    AuditLogCreate,
    AuditLogResponse,
    MessageResponse,
)

__all__ = ["AuditLogCreate", "AuditLogResponse", "ArchiveResult", "MessageResponse"]
