"""
Leave main router — domain routers under /leave.

Domains:
  policy/   versioned leave policies
  request/  submit / list / cancel + approval decision handler
  ledger/   balances, ledger posts, apply-context, day calculation
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.leave.ledger.routes import router as ledger_router
from app.modules.leave.policy.routes import router as policy_router
from app.modules.leave.request.routes import router as request_router

router = APIRouter(prefix="/leave", tags=["Leave"])

router.include_router(policy_router)
router.include_router(request_router)
router.include_router(ledger_router)
