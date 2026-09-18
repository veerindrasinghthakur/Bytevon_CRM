"""
My-work main routers.

  attendance → /my-work/attendance/* + /my-work/approvers
  stubs      → /my-work/overview, leave, tasks, requests, approvals list
  profile    → /profile/*  (exported as profile_router for api/router)
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.my_work.attendance.routes import router as attendance_router
from app.modules.my_work.profile.routes import router as profile_router
from app.modules.my_work.stubs.routes import router as stubs_router

router = APIRouter()
# Stubs first so static paths like /my-work/attendance (list) register
# before more specific /my-work/attendance/today-info (both work; order OK).
router.include_router(stubs_router)
router.include_router(attendance_router)

__all__ = ["router", "profile_router"]
