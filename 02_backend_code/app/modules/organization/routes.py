"""
Deprecated: prefer app.modules.admin.routes (admin_router + organization_router).

Policy masters (incl. attendance policies) live here.
Operational departments also still exposed for legacy clients; preferred path is /workforce/departments.
"""
from __future__ import annotations

from app.modules.admin.routes import organization_router as router

__all__ = ["router"]
