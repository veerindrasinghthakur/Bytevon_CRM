"""Approvals main router — includes domain routers."""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.approvals.approval_action.routes import router as action_router
from app.modules.approvals.request.routes import router as request_router

router = APIRouter()
# Request routes first (static paths like /kpis, /pending, /requests before /{id})
router.include_router(request_router)
router.include_router(action_router)
