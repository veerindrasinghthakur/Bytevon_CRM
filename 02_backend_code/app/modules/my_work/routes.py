"""
My-work main routers — domain includes only.

  attendance → /my-work/attendance/* + /my-work/approvers
  profile    → /profile/*  (exported as profile_router for api/router)
"""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.my_work.attendance.routes import router as attendance_router
from app.modules.my_work.profile.routes import router as profile_router

router = APIRouter()
router.include_router(attendance_router)

__all__ = ["router", "profile_router"]
