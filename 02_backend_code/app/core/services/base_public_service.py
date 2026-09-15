"""
BasePublicService — infrastructure only.

Every module Public Service inherits from this class.
Public Service owns the transaction boundary.
Notification and Audit are called *after* successful commit (best-effort).
"""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Map first segment of "entity.verb" keys → AuditReferenceType value
_REF_MAP = {
    "department": "DEPARTMENT",
    "working_week": "ORGANIZATION",
    "shift": "ORGANIZATION",
    "holiday_calendar": "ORGANIZATION",
    "holiday": "ORGANIZATION",
    "location": "LOCATION",
    "organization_settings": "ORGANIZATION",
    "position": "EMPLOYMENT",
    "employment": "EMPLOYMENT",
    "role": "ROLE",
    "permission": "PERMISSION",
    "employee_role": "ROLE",
    "approval_request": "APPROVAL_REQUEST",
    "leave_policy": "LEAVE_REQUEST",
    "leave_request": "LEAVE_REQUEST",
    "leave_ledger": "LEAVE_REQUEST",
    "attendance": "ATTENDANCE",
    "attendance_correction": "ATTENDANCE_CORRECTION",
    "attendance_policy": "ATTENDANCE",
    "client": "CLIENT",
    "client_contact": "CLIENT",
    "platform": "PLATFORM",
    "lead": "LEAD",
    "team": "TEAM",
    "project": "PROJECT",
    "task": "TASK",
    "task_time_entry": "TASK",
    "note": "NOTE",
    "document": "DOCUMENT",
    "document_type": "DOCUMENT",
    "employee_salary": "PAYROLL",
    "payroll": "PAYROLL",
    "login": "LOGIN",
    "session": "SESSION",
    "auth": "LOGIN",
}

# Map verb keywords → AuditAction value
_ACTION_MAP = {
    "created": "CREATE",
    "create": "CREATE",
    "updated": "UPDATE",
    "update": "UPDATE",
    "archived": "ARCHIVE",
    "archive": "ARCHIVE",
    "restored": "RESTORE",
    "restore": "RESTORE",
    "login": "LOGIN",
    "logout": "LOGOUT",
    "password_change": "PASSWORD_CHANGE",
    "password_changed": "PASSWORD_CHANGE",
    "approved": "APPROVE",
    "approve": "APPROVE",
    "rejected": "REJECT",
    "reject": "REJECT",
    "assigned": "ASSIGN",
    "assign": "ASSIGN",
    "unassigned": "UNASSIGN",
    "unassign": "UNASSIGN",
    "status_changed": "STATUS_CHANGE",
    "won": "STATUS_CHANGE",
    "submitted": "CREATE",
    "cancelled": "UPDATE",
    "cancelled_via_approval": "UPDATE",
    "commented": "UPDATE",
    "punch": "CREATE",
    "posted": "CREATE",
    "calculated": "CREATE",
    "paid": "STATUS_CHANGE",
    "linked": "CREATE",
    "version_added": "CREATE",
    "monthly_summary_rebuilt": "UPDATE",
    "monthly_summary_locked": "UPDATE",
    "break_started": "CREATE",
    "break_ended": "UPDATE",
    "created_from_lead": "CREATE",
}


class BasePublicService:
    """
    Base class for all module Public Services.

    Responsibilities of subclasses:
    - Own business logic and domain validation
    - Explicitly manage transactions via the helpers below
    - After successful commit, call Notification / Audit via helpers
      (failure of those must not roll back the business work)
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ------------------------------------------------------------------
    # Protected transaction helpers
    # ------------------------------------------------------------------

    async def _commit(self) -> None:
        await self._session.commit()

    async def _rollback(self) -> None:
        await self._session.rollback()

    async def _flush(self) -> None:
        await self._session.flush()

    async def _refresh(self, instance: object) -> None:
        await self._session.refresh(instance)

    async def _run_in_transaction(self, work_coro):
        try:
            result = await work_coro
            await self._commit()
            return result
        except Exception:
            await self._rollback()
            raise

    # ------------------------------------------------------------------
    # Unified post-commit audit (compatible with module `await self._audit(...)`)
    # ------------------------------------------------------------------

    async def _audit(
        self,
        action_key: str,
        entity_id: int,
        actor_employment_id: Optional[int] = None,
        *,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Best-effort audit after business commit.

        `action_key` convention used across modules: ``entity.verb``
        e.g. ``lead.won``, ``department.created``, ``payroll.paid``.
        """
        try:
            from app.core.config import settings
            from app.core.db.enums import AuditAction, AuditReferenceType
            from app.core.database import AsyncSessionLocal
            from app.modules.admin.audit.schemas import AuditLogCreate
            from app.modules.admin.audit.service import AuditService

            ref_type, action = self._resolve_audit_enums(action_key)
            desc = description or action_key.replace(".", " ").replace("_", " ")

            async with AsyncSessionLocal() as audit_session:
                svc = AuditService(audit_session)
                await svc.log(
                    AuditLogCreate(
                        reference_type=AuditReferenceType(ref_type),
                        reference_id=int(entity_id),
                        action=AuditAction(action),
                        description=desc,
                        employment_id=actor_employment_id
                        or settings.SYSTEM_EMPLOYMENT_ID,
                        ip_address=ip_address,
                        user_agent=user_agent,
                    )
                )
        except Exception:
            logger.exception(
                "Post-commit audit failed key=%s entity_id=%s",
                action_key,
                entity_id,
            )

    def _resolve_audit_enums(self, action_key: str) -> tuple[str, str]:
        parts = action_key.split(".", 1)
        entity = parts[0].lower() if parts else "system"
        verb = parts[1].lower() if len(parts) > 1 else "update"

        ref = _REF_MAP.get(entity, "SYSTEM")
        action = _ACTION_MAP.get(verb)
        if action is None:
            # fuzzy fallback
            for key, val in _ACTION_MAP.items():
                if key in verb:
                    action = val
                    break
            if action is None:
                action = "UPDATE"
        return ref, action

    async def _audit_event(
        self,
        *,
        reference_type: str,
        reference_id: int,
        action: str,
        description: str,
        employment_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """Explicit enum-based audit (preferred when caller knows enums)."""
        try:
            from app.core.db.enums import AuditAction, AuditReferenceType
            from app.core.database import AsyncSessionLocal
            from app.modules.admin.audit.schemas import AuditLogCreate
            from app.modules.admin.audit.service import AuditService

            async with AsyncSessionLocal() as audit_session:
                svc = AuditService(audit_session)
                await svc.log(
                    AuditLogCreate(
                        reference_type=AuditReferenceType(reference_type),
                        reference_id=reference_id,
                        action=AuditAction(action),
                        description=description,
                        employment_id=employment_id,
                        ip_address=ip_address,
                        user_agent=user_agent,
                    )
                )
        except Exception:
            logger.exception(
                "Post-commit audit failed (%s %s/%s)",
                action,
                reference_type,
                reference_id,
            )

    async def _notify(
        self,
        *,
        employment_id: int,
        title: str,
        body: str,
        payload: Optional[dict] = None,
    ) -> None:
        """Best-effort IN_APP notification to one employment."""
        try:
            from app.core.database import AsyncSessionLocal
            from app.core.db.enums import NotificationRecipientType
            from app.modules.notifications.schemas.schemas import NotifyRequest
            from app.modules.notifications.services.public_service import (
                NotificationPublicService,
            )

            async with AsyncSessionLocal() as notif_session:
                svc = NotificationPublicService(notif_session)
                await svc.notify(
                    NotifyRequest(
                        recipient_type=NotificationRecipientType.EMPLOYMENT,
                        recipient_id=employment_id,
                        title=title,
                        body=body,
                        payload=payload or {},
                    )
                )
        except Exception:
            logger.exception(
                "Post-commit notify failed employment_id=%s title=%s",
                employment_id,
                title,
            )
