"""Application lifespan (startup / shutdown)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import AsyncSessionLocal, engine
from app.modules.approvals.approval_action.service import (
    register_approval_decision_handler,
)

logger = logging.getLogger(__name__)

# NOTE: The lead UI columns (contact_title, priority, chat_link) were previously
# patched here via ALTER TABLE on every startup. They are now managed by Alembic
# migration f1c2d4b87ad6_add_leads_ui_fields — no startup DDL needed.


async def _leave_approval_decision_handler(event: dict) -> None:
    """Bridge Approvals post-commit event → Leave local status + ledger."""
    from app.modules.leave.request.service import RequestService

    async with AsyncSessionLocal() as session:
        service = RequestService(session)
        await service.handle_approval_decision(event)


async def _attendance_approval_decision_handler(event: dict) -> None:
    from app.modules.workforce.attendance.service import AttendanceService

    async with AsyncSessionLocal() as session:
        service = AttendanceService(session)
        await service.handle_approval_decision(event)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ByteVon CRM backend")
    register_approval_decision_handler(_leave_approval_decision_handler)
    register_approval_decision_handler(_attendance_approval_decision_handler)
    logger.info("Registered Leave + Attendance approval decision handlers")
    yield
    logger.info("Shutting down ByteVon CRM backend")
    await engine.dispose()
