"""
My-work main routers.

  attendance → /my-work/attendance/* + /my-work/approvers
  leave      → /my-work/leave/*
  tasks      → /my-work/tasks
  requests   → /my-work/requests
  approvals  → /my-work/approvals
  profile    → /profile/*  (exported as profile_router for api/router only)
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.my_work.approvals.routes import router as approvals_router
from app.modules.my_work.attendance.routes import router as attendance_router
from app.modules.my_work.leave.routes import router as leave_router
from app.modules.my_work.profile.routes import router as profile_router
from app.modules.my_work.requests.routes import router as requests_router
from app.modules.my_work.tasks.routes import router as tasks_router

router = APIRouter()
router.include_router(leave_router)
router.include_router(tasks_router)
router.include_router(requests_router)
router.include_router(approvals_router)
router.include_router(attendance_router)
# profile_router is mounted once from app.api.router — do not include here

__all__ = ["router", "profile_router"]
