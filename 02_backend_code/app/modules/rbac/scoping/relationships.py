"""
RelationshipPolicy — actor↔target relationship checks beyond data scope.

Registered per (resource, action) alongside SCOPE_ADAPTERS.
Scope answers "can the actor see rows in this set?"; relationship answers
"may this actor perform this action on *this* target?".

Failure → ForbiddenError (403): record is not hidden; action is denied.
"""
from __future__ import annotations

from typing import Any, Optional, Protocol, runtime_checkable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ApprovalStatus, ApprovalTarget
from app.core.exceptions.exception import ForbiddenError
from app.modules.approvals.models import ApprovalRequest
from app.modules.rbac.authz_decision import log_authz_decision
from app.modules.workforce.department.models import Department


@runtime_checkable
class RelationshipPolicy(Protocol):
    """check(actor, resource, action, target) -> bool"""

    resource: str
    action: str

    async def check(
        self,
        session: AsyncSession,
        *,
        actor_employment_id: int,
        resource: str,
        action: str,
        target: Any,
    ) -> bool:
        ...


class LeaveApproveRelationshipPolicy:
    """
    Approve/reject leave-backed approval requests.

    Valid approver:
    - status PENDING
    - actor is not requester
    - DEPARTMENT_HEAD / DEPARTMENT → actor is department_head_employment_id
    """

    resource = "leave_request"
    action = "APPROVE"

    async def check(
        self,
        session: AsyncSession,
        *,
        actor_employment_id: int,
        resource: str,
        action: str,
        target: Any,
    ) -> bool:
        req = target
        if not isinstance(req, ApprovalRequest):
            return False

        rt = (req.request_type or "").upper()
        if not rt.startswith("LEAVE"):
            return False

        status = req.status
        status_val = status.value if hasattr(status, "value") else str(status)
        if status_val != ApprovalStatus.PENDING.value:
            return False

        if req.requester_employment_id == actor_employment_id:
            return False

        target_kind = req.target
        target_val = (
            target_kind.value if hasattr(target_kind, "value") else str(target_kind)
        )

        if target_val in (
            ApprovalTarget.DEPARTMENT_HEAD.value,
            ApprovalTarget.DEPARTMENT.value,
        ):
            if req.target_department_id is None:
                return False
            dept = await session.get(Department, req.target_department_id)
            if dept is None:
                return False
            head_id = dept.department_head_employment_id
            if head_id is None:
                return False
            return int(head_id) == int(actor_employment_id)

        return False


RELATIONSHIP_POLICIES: dict[tuple[str, str], RelationshipPolicy] = {
    (LeaveApproveRelationshipPolicy.resource, LeaveApproveRelationshipPolicy.action): (
        LeaveApproveRelationshipPolicy()
    ),
}


def get_relationship_policy(
    resource: str, action: str
) -> Optional[RelationshipPolicy]:
    return RELATIONSHIP_POLICIES.get((resource, action.upper()))


async def enforce_relationship(
    session: AsyncSession,
    *,
    actor_employment_id: int,
    resource: str,
    action: str,
    target: Any,
    is_super_admin: bool = False,
) -> None:
    """
    Run registered relationship policy if present.

    Super Admin bypasses. Failed check → ForbiddenError 403 + DENY log.
    """
    target_id = getattr(target, "id", None)
    if is_super_admin:
        log_authz_decision(
            actor_employment_id=actor_employment_id,
            resource=resource,
            action=action,
            result="ALLOW",
            reason="super_admin_relationship_bypass",
            target_id=target_id,
        )
        return
    policy = get_relationship_policy(resource, action)
    if policy is None:
        return
    ok = await policy.check(
        session,
        actor_employment_id=actor_employment_id,
        resource=resource,
        action=action.upper(),
        target=target,
    )
    if not ok:
        log_authz_decision(
            actor_employment_id=actor_employment_id,
            resource=resource,
            action=action,
            result="DENY",
            reason="relationship_denied",
            target_id=target_id,
        )
        raise ForbiddenError(
            "You are not allowed to perform this action on this record",
            code="relationship_denied",
        )
    log_authz_decision(
        actor_employment_id=actor_employment_id,
        resource=resource,
        action=action,
        result="ALLOW",
        reason="relationship_ok",
        target_id=target_id,
    )
