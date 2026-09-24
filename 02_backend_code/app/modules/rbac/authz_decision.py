"""
Authorization decision logging for Phases 3 (scope) and 5 (relationship).

Existing mechanism: `audit_logs` via AuditService (immutable, post-commit).
This module always emits structured application logs:
  INFO  → ALLOW
  WARN  → DENY

Fields: actor employment_id, resource, action, target id, resolved scope,
result, reason, timestamp.

Heavier detail (also best-effort write to audit_logs) for:
  - EXPORT actions
  - role / permission grant changes
  - approval approve/reject decisions
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any, Mapping, Optional

logger = logging.getLogger("app.authz.decision")

_HEAVY_ACTIONS = frozenset(
    {
        "EXPORT",
        "APPROVE",
        "REJECT",
        "GRANT",
        "REVOKE",
        "ASSIGN_ROLE",
        "UNASSIGN_ROLE",
        "SET_SENSITIVE_FIELD",
    }
)


def _scope_repr(scope: Any) -> str | None:
    if scope is None:
        return None
    if isinstance(scope, str):
        return scope
    if isinstance(scope, Mapping):
        return str(dict(scope))
    # ScopeConstraint-like
    parts: list[str] = []
    if getattr(scope, "organization_wide", False):
        parts.append("ORGANIZATION")
    for attr in ("employment_ids", "team_ids", "department_ids", "location_ids"):
        vals = getattr(scope, attr, None) or []
        if vals:
            parts.append(f"{attr}={list(vals)}")
    return ",".join(parts) if parts else str(scope)


def log_authz_decision(
    *,
    actor_employment_id: int | None,
    resource: str,
    action: str,
    result: str,
    reason: str,
    target_id: int | None = None,
    resolved_scope: Any = None,
    extra: Mapping[str, Any] | None = None,
) -> None:
    """
    Structured ALLOW/DENY log. Never raises.

    result: "ALLOW" | "DENY"
    """
    try:
        payload = {
            "ts": datetime.now(UTC).isoformat(),
            "actor_employment_id": actor_employment_id,
            "resource": resource,
            "action": action,
            "target_id": target_id,
            "resolved_scope": _scope_repr(resolved_scope),
            "result": result.upper(),
            "reason": reason,
        }
        if extra:
            payload["extra"] = dict(extra)

        msg = (
            "authz decision result=%(result)s actor=%(actor_employment_id)s "
            "resource=%(resource)s action=%(action)s target=%(target_id)s "
            "scope=%(resolved_scope)s reason=%(reason)s"
        )
        if result.upper() == "ALLOW":
            logger.info(msg, payload)
        else:
            logger.warning(msg, payload)

        if result.upper() == "ALLOW" and action.upper() in _HEAVY_ACTIONS:
            _persist_heavy_decision(payload)
        elif result.upper() == "DENY" and action.upper() in _HEAVY_ACTIONS:
            _persist_heavy_decision(payload)
    except Exception:
        logger.exception("authz decision log failed")


def _persist_heavy_decision(payload: dict[str, Any]) -> None:
    """Best-effort mirror into audit_logs for high-value decisions."""
    try:
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        async def _write() -> None:
            from app.core.database import AsyncSessionLocal
            from app.core.db.enums import AuditAction, AuditReferenceType
            from app.modules.admin.audit.schemas import AuditLogCreate
            from app.modules.admin.audit.service import AuditService

            action_map = {
                "EXPORT": AuditAction.EXPORT,
                "APPROVE": AuditAction.APPROVE,
                "REJECT": AuditAction.REJECT,
                "GRANT": AuditAction.ASSIGN,
                "REVOKE": AuditAction.UNASSIGN,
                "ASSIGN_ROLE": AuditAction.ASSIGN,
                "UNASSIGN_ROLE": AuditAction.UNASSIGN,
                "SET_SENSITIVE_FIELD": AuditAction.UPDATE,
            }
            act = action_map.get(str(payload.get("action", "")).upper(), AuditAction.UPDATE)
            ref = AuditReferenceType.SYSTEM
            resource = str(payload.get("resource") or "").lower()
            if resource in ("approval", "leave_request"):
                ref = AuditReferenceType.APPROVAL_REQUEST
            elif resource in ("role", "permission"):
                ref = AuditReferenceType.ROLE
            elif resource == "employment":
                ref = AuditReferenceType.EMPLOYMENT

            desc = (
                f"authz {payload.get('result')} resource={payload.get('resource')} "
                f"action={payload.get('action')} target={payload.get('target_id')} "
                f"scope={payload.get('resolved_scope')} reason={payload.get('reason')}"
            )
            async with AsyncSessionLocal() as session:
                await AuditService(session).log(
                    AuditLogCreate(
                        reference_type=ref,
                        reference_id=int(payload.get("target_id") or 0),
                        action=act,
                        description=desc,
                        employment_id=payload.get("actor_employment_id"),
                    )
                )

        if loop and loop.is_running():
            loop.create_task(_write())
        else:
            asyncio.run(_write())
    except Exception:
        logger.exception("heavy authz audit_logs write failed")
