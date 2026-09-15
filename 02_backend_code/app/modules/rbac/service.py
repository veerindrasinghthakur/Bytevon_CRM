"""RBACService — public entry (flattened module layout)."""

from __future__ import annotations

from app.modules.rbac.services.public_service import RBACService, RBACPublicService

__all__ = ["RBACService", "RBACPublicService"]
