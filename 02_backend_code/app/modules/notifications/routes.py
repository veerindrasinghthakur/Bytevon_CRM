"""Notifications main router — includes domain routers."""
from __future__ import annotations

from fastapi import APIRouter

from app.modules.notifications.attachments.routes import router as attachments_router
from app.modules.notifications.center.routes import router as center_router
from app.modules.notifications.compose.routes import router as compose_router
from app.modules.notifications.drafts.routes import router as drafts_router
from app.modules.notifications.preference.routes import router as preference_router
from app.modules.notifications.sent.routes import router as sent_router
from app.modules.notifications.settings.routes import router as settings_router
from app.modules.notifications.template.routes import router as template_router

router = APIRouter()
# Static paths before parameterized /{notification_id} on center
router.include_router(template_router)
router.include_router(compose_router)
router.include_router(settings_router)
router.include_router(preference_router)
router.include_router(sent_router)
router.include_router(attachments_router)
router.include_router(drafts_router)
router.include_router(center_router)
