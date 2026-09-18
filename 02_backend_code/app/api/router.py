"""
Root API router.

Attendance:
  /workforce/attendance/*  — HR/ops
  /my-work/attendance/*    — self-service
  /admin/*                 — org masters (locations, shifts, depts, users, settings)
  /dashboard/*             — executive / employee views (stubs OK)
"""
from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.modules.approvals.routes import router as approvals_router
from app.modules.auth.routes import router as auth_router
from app.modules.workforce.routes import router as workforce_router
from app.modules.leave.routes import router as leave_router
from app.modules.notifications.routes import router as notifications_router
from app.modules.admin.routes import router as admin_router
from app.modules.rbac.routes import router as rbac_router
from app.modules.audit.routes import router as audit_router
from app.modules.project.routes import router as project_router
from app.modules.payroll.routes import router as payroll_router
from app.modules.sales.routes import router as sales_router
from app.modules.my_work.routes import router as my_work_router
from app.modules.my_work.routes import profile_router as my_work_profile_router
from app.modules.dashboard.routes import router as dashboard_router

api_router = APIRouter(prefix=settings.API_V1_PREFIX)

api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(workforce_router)
api_router.include_router(rbac_router)
api_router.include_router(approvals_router)
api_router.include_router(leave_router)
api_router.include_router(notifications_router)
api_router.include_router(sales_router)
api_router.include_router(audit_router)
api_router.include_router(payroll_router)
api_router.include_router(my_work_router)
api_router.include_router(my_work_profile_router)
api_router.include_router(project_router)
api_router.include_router(dashboard_router)
