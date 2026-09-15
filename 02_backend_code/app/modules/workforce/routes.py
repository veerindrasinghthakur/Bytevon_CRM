"""
Workforce main router — includes domain routers.

Domain ownership:
  employee/   — persons, positions, employments
  assignment/ — assignments + state history

Department → admin module. Attendance → attendance module.
Bank details → payroll (not in this package).
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.workforce.employee.routes import router as employee_router
from app.modules.workforce.assignment.routes import router as assignment_router

router = APIRouter(prefix="/workforce", tags=["Workforce"])

router.include_router(employee_router)
router.include_router(assignment_router)
