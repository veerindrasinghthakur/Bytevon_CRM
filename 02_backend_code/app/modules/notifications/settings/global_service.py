"""Global notification settings (admin) — KV store with seeded defaults."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.notifications.models import NotificationSetting

DEFAULTS: dict[str, Any] = {
    "channels": [
        {"id": "in_app", "name": "In-App", "enabled": True},
        {"id": "email", "name": "Email", "enabled": True},
    ],
    "triggers": [
        {"id": "leave_submitted", "event": "Leave submitted", "description": "Employee submits a leave request", "in_app": True, "email": True, "enabled": True},
        {"id": "leave_decision", "event": "Leave decision", "description": "Leave request approved or rejected", "in_app": True, "email": True, "enabled": True},
        {"id": "attendance_submitted", "event": "Attendance correction submitted", "description": "Employee submits an attendance correction", "in_app": True, "email": False, "enabled": True},
        {"id": "attendance_decision", "event": "Attendance decision", "description": "Attendance correction approved or rejected", "in_app": True, "email": True, "enabled": True},
        {"id": "payroll_paid", "event": "Payroll paid", "description": "Monthly payroll marked paid", "in_app": True, "email": True, "enabled": True},
    ],
    "batch": {"frequency": "hourly"},
    "quiet": {"enabled": True, "start": "21:00", "end": "07:00"},
    "exemptions": ["Security Alerts", "System Down"],
}


class GlobalSettingsService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_settings(self) -> dict[str, Any]:
        rows = (await self._session.execute(select(NotificationSetting))).scalars().all()
        out = {k: v for k, v in DEFAULTS.items()}
        for row in rows:
            out[row.key] = row.value
        return out

    async def update_settings(
        self, patch: dict[str, Any], *, actor_employment_id: int | None = None
    ) -> dict[str, Any]:
        allowed = set(DEFAULTS)
        for key, value in patch.items():
            if key not in allowed or value is None:
                continue
            row = await self._session.get(NotificationSetting, key)
            if row is None:
                row = NotificationSetting(key=key, value=value)
                self._session.add(row)
            else:
                row.value = value
        await self._commit()
        await self._audit("notification.settings_updated", 0, actor_employment_id)
        return await self.get_settings()
