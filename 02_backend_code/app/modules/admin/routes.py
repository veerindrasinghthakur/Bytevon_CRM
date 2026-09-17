"""Admin module main router — all org masters under /admin only."""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.admin.department.routes import router as department_router
from app.modules.admin.location.routes import router as location_router
from app.modules.admin.shift.routes import router as shift_router
from app.modules.admin.working_week.routes import router as working_week_router
from app.modules.admin.holiday_calendar.routes import router as holiday_calendar_router
from app.modules.admin.settings.routes import router as settings_router
from app.modules.admin.user.routes import router as user_router
from app.modules.admin.position.routes import router as position_router
from app.modules.admin.audit.routes import router as audit_router

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

router.include_router(department_router)
router.include_router(location_router)
router.include_router(shift_router)
router.include_router(working_week_router)
router.include_router(holiday_calendar_router)
router.include_router(settings_router)
router.include_router(user_router)
router.include_router(position_router)
router.include_router(audit_router)
