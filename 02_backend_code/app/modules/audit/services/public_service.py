"""Compatibility: AuditPublicService lives in admin.audit.service."""
from app.modules.admin.audit.service import AuditPublicService, AuditService

__all__ = ["AuditPublicService", "AuditService"]
