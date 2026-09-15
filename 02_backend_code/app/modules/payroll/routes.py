"""
Payroll main router — domain includes only.

STATIC paths registered before parameterized /{payroll_id}.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.payroll.dashboard.routes import router as dashboard_router
from app.modules.payroll.employee_payroll.routes import router as employee_router
from app.modules.payroll.history.routes import router as history_router
from app.modules.payroll.monthly_payroll.routes import router as monthly_router
from app.modules.payroll.payroll_run.routes import router as run_router
from app.modules.payroll.payslip.routes import router as payslip_router
from app.modules.payroll.review.routes import router as review_router
from app.modules.payroll.salary_management.routes import router as salary_router

router = APIRouter()
# Static first
router.include_router(dashboard_router)
router.include_router(employee_router)
router.include_router(history_router)
router.include_router(run_router)
router.include_router(salary_router)
router.include_router(monthly_router)
# Parameterized last
router.include_router(review_router)
router.include_router(payslip_router)
