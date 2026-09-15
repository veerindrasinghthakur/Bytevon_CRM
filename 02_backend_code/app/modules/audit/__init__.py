"""
Deprecated: audit lives under app.modules.admin.audit.
Compatibility re-exports so existing imports keep working.
"""
from app.modules.admin.audit.models import AuditLog
from app.modules.admin.audit.service import AuditPublicService, AuditService

__all__ = ["AuditLog", "AuditService", "AuditPublicService"]
