"""
Deprecated: prefer app.modules.admin.routes (admin_router + organization_router).

This module re-exports the admin legacy /organization alias so any remaining
`from app.modules.organization.routes import router` keeps working.
"""
from __future__ import annotations

from app.modules.admin.routes import organization_router as router

__all__ = ["router"]
