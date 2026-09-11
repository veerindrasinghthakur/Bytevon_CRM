"""
Root API router. Include module routers here.

Module package names (2026-09-09):
  authentication → auth
  employment → workforce
  developer → project
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
from app.modules.notes_documents.routes import router as notes_documents_router
from app.modules.payroll.routes import router as payroll_router
from app.modules.sales.routes import router as sales_router
from app.modules.profile.routes import router as profile_router
from app.modules.my_work.routes import router as my_work_router

api_router = APIRouter(prefix=settings.API_V1_PREFIX)

api_router.include_router(auth_router)
api_router.include_router(organization_router)
api_router.include_router(workforce_router)
api_router.include_router(rbac_router)
api_router.include_router(approvals_router)
api_router.include_router(leave_router)
api_router.include_router(attendance_router)
api_router.include_router(notifications_router)
api_router.include_router(sales_router)
api_router.include_router(project_router)
api_router.include_router(notes_documents_router)
api_router.include_router(audit_router)
api_router.include_router(payroll_router)
api_router.include_router(profile_router)
api_router.include_router(my_work_router)
