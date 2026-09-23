"""
Workforce main router — domain routers under /workforce.

Domains:
  employee/     persons, positions, employments
  assignment/   state + assignments
  department/   operational department CRUD + members
  attendance/   operational days, punches, corrections, summaries, breaks

Policy masters (attendance policy, org settings) stay admin.
Self-service "my attendance" will later move to my-work.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.workforce.assignment.routes import router as assignment_router
from app.modules.workforce.attendance.routes import router as attendance_router
from app.modules.workforce.department.routes import router as department_router
from app.modules.workforce.employee.routes import router as employee_router
from app.modules.workforce.shift.routes import router as shift_router

router = APIRouter(prefix="/workforce", tags=["Workforce"])

router.include_router(employee_router)
router.include_router(assignment_router)
router.include_router(department_router)
router.include_router(attendance_router)
router.include_router(shift_router)
