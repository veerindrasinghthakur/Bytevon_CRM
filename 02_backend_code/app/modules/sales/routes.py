"""
Sales main router — includes domain API routers.

UI-shaped endpoints remain in routes_ui.py and lead_ui.py (included separately).
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.sales.lead.routes import router as lead_router
from app.modules.sales.client.routes import router as client_router
from app.modules.sales.source.routes import router as source_router
from app.modules.sales.activity.routes import router as activity_router
from app.modules.sales.case_study.routes import router as case_study_router
from app.modules.sales.dashboard.routes import router as dashboard_router

router = APIRouter(prefix="/sales", tags=["Sales"])

router.include_router(lead_router)
router.include_router(client_router)
router.include_router(source_router)
router.include_router(activity_router)
router.include_router(case_study_router)
router.include_router(dashboard_router)
