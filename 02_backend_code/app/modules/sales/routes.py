"""
Sales main router — includes domain API routers.

UI-shaped list/filter endpoints remain in routes_ui.py and lead_ui.py.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.sales.domains.client.routes import router as client_router
from app.modules.sales.domains.lead.routes import router as lead_router
from app.modules.sales.domains.platform.routes import router as platform_router

router = APIRouter(prefix="/sales", tags=["Sales"])

router.include_router(client_router)
router.include_router(platform_router)
router.include_router(lead_router)
