"""
Root API router. Include module routers here.

Module package names (2026-09-09):
  authentication → auth
  employment → workforce
  developer → project

Notes & Documents live under project (note/ + document/ domains).
Profile HTTP paths (/profile/*) are owned by the my_work package.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.modules.approvals.routes import router as approvals_router
from app.modules.attendance.routes import router as attendance_router
from app.modules.auth.routes import router as auth_router
from app.modules.workforce.routes import router as workforce_router
from app.modules.leave.routes import router as leave_router
from app.modules.notifications.routes import router as notifications_router
from app.modules.organization.routes import router as organization_router
from app.modules.rbac.routes import router as rbac_router
from app.modules.audit.routes import router as audit_router
from app.modules.project.routes import router as project_router
from app.modules.payroll.routes import router as payroll_router
from app.modules.sales.routes_ui import router as sales_ui_router
from app.modules.sales.routes import router as sales_router
from app.modules.my_work.routes import router as my_work_router
from app.modules.my_work.routes import profile_router as my_work_profile_router

api_router = APIRouter(prefix=settings.API_V1_PREFIX)

api_router.include_router(auth_router)
api_router.include_router(organization_router)
api_router.include_router(workforce_router)
api_router.include_router(rbac_router)
api_router.include_router(approvals_router)
api_router.include_router(leave_router)
api_router.include_router(attendance_router)
api_router.include_router(notifications_router)
# Static sales UI paths first so /leads/filter-options is not captured as {lead_id}
api_router.include_router(sales_ui_router)
api_router.include_router(sales_router)
api_router.include_router(project_router)
api_router.include_router(audit_router)
api_router.include_router(payroll_router)
api_router.include_router(my_work_router)
api_router.include_router(my_work_profile_router)
