"""
Deprecated: prefer /admin/audit/* via app.modules.admin.routes.
Re-exports admin audit router under legacy /audit prefix for compatibility.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.admin.audit.routes import router as _admin_audit_router

router = APIRouter(tags=["Audit (legacy)"])
router.include_router(_admin_audit_router)
