"""RBACService — public entry (flattened module layout)."""

from __future__ import annotations

# Temporary bridge: full implementation still in services/public_service until
# nested package is deleted. Imports there already use flat repository/schemas.
from app.modules.rbac.services.public_service import RBACPublicService as RBACService

__all__ = ["RBACService", "RBACPublicService"]

RBACPublicService = RBACService
