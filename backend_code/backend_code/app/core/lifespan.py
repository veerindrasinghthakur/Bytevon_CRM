"""Application lifespan (startup / shutdown)."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import AsyncSessionLocal, engine
from app.modules.approvals.services.public_service import (
    register_approval_decision_handler,
)

logger = logging.getLogger(__name__)


async def _leave_approval_decision_handler(event: dict) -> None:
    """Bridge Approvals post-commit event → Leave local status + ledger."""
    from app.modules.leave.services.public_service import LeavePublicService

    async with AsyncSessionLocal() as session:
        service = LeavePublicService(session)
        await service.handle_approval_decision(event)


async def _attendance_approval_decision_handler(event: dict) -> None:
    """Bridge Approvals post-commit event → Attendance correction + day rebuild."""
    from app.modules.attendance.services.public_service import AttendancePublicService

    async with AsyncSessionLocal() as session:
        service = AttendancePublicService(session)
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
