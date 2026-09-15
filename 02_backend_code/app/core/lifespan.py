"""Application lifespan (startup / shutdown)."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import AsyncSessionLocal, engine
from app.modules.approvals.services.public_service import (
    register_approval_decision_handler,
)

logger = logging.getLogger(__name__)

# Lightweight schema patches so ORM mapped columns do not 500 before a full migration.
_LEAD_COLUMN_PATCHES = (
    "ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_title VARCHAR(150) NULL",
    "ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NULL",
    "ALTER TABLE leads ADD COLUMN IF NOT EXISTS chat_link VARCHAR(500) NULL",
)


async def _ensure_lead_ui_columns() -> None:
    """Idempotent DDL so GET /sales/leads does not explode after model adds."""
    try:
        async with engine.begin() as conn:
            for stmt in _LEAD_COLUMN_PATCHES:
                await conn.execute(text(stmt))
        logger.info("Lead UI columns ensured (contact_title, priority, chat_link)")
    except Exception:
        # Non-fatal: SQLite/MySQL dialect differences or missing table in fresh env
        logger.exception("Could not ensure lead UI columns — run scripts/alter_leads_ui_fields.sql")


async def _leave_approval_decision_handler(event: dict) -> None:
    """Bridge Approvals post-commit event → Leave local status + ledger."""
    from app.modules.leave.request.service import RequestService

    async with AsyncSessionLocal() as session:
        service = RequestService(session)
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
    await _ensure_lead_ui_columns()
    register_approval_decision_handler(_leave_approval_decision_handler)
    register_approval_decision_handler(_attendance_approval_decision_handler)
    logger.info("Registered Leave + Attendance approval decision handlers")
    yield
    logger.info("Shutting down ByteVon CRM backend")
    await engine.dispose()
