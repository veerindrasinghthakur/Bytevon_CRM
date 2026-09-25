"""Recipient resolution for notifications (Phase 0).

Converts {EMPLOYMENT|DEPARTMENT|TEAM, id} into active employment_id lists and
implements the approver chain: requester's department head -> HR members ->
Super Admin holders. Membership is snapshotted at send time (no retroactive
updates when membership changes later).
"""
from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import EmploymentState, NotificationRecipientType

logger = logging.getLogger(__name__)

ACTIVE_STATES = (
    EmploymentState.ONBOARDING,
    EmploymentState.PROBATION,
    EmploymentState.CONFIRMED,
    EmploymentState.SERVING_NOTICE,
)

SUPER_ADMIN_ROLE_NAMES = ("Super Admin", "SuperAdmin")
HR_DEPARTMENT_NAME = "HR"


async def _active_employment_ids(
    session: AsyncSession, employment_ids: list[int]
) -> list[int]:
    """Filter an employment id list down to active employments (stable order)."""
    if not employment_ids:
        return []
    from app.modules.workforce.models import Employment

    rows = (
        await session.execute(
            select(Employment.id).where(
                Employment.id.in_(employment_ids),
                Employment.current_state.in_(ACTIVE_STATES),
            )
        )
    ).all()
    found = {int(r[0]) for r in rows}
    return [e for e in employment_ids if e in found]


async def _department_member_ids(session: AsyncSession, department_id: int) -> list[int]:
    from app.modules.workforce.models import Employment, EmploymentAssignment

    today = date.today()
    rows = (
        await session.execute(
            select(EmploymentAssignment.employment_id)
            .join(Employment, Employment.id == EmploymentAssignment.employment_id)
            .where(
                EmploymentAssignment.department_id == department_id,
                EmploymentAssignment.effective_from <= today,
                (
                    (EmploymentAssignment.effective_to.is_(None))
                    | (EmploymentAssignment.effective_to >= today)
                ),
                Employment.current_state.in_(ACTIVE_STATES),
            )
            .order_by(EmploymentAssignment.employment_id)
        )
    ).all()
    return [int(r[0]) for r in rows]


async def _team_member_ids(session: AsyncSession, team_id: int) -> list[int]:
    from app.modules.project.team.models import TeamMember
    from app.modules.workforce.models import Employment

    rows = (
        await session.execute(
            select(TeamMember.employment_id)
            .join(Employment, Employment.id == TeamMember.employment_id)
            .where(
                TeamMember.team_id == team_id,
                TeamMember.is_member.is_(True),
                Employment.current_state.in_(ACTIVE_STATES),
            )
            .order_by(TeamMember.employment_id)
        )
    ).all()
    return [int(r[0]) for r in rows]


async def all_active_employment_ids(session: AsyncSession) -> list[int]:
    """Every active employment id (broadcast snapshot), ordered."""
    from app.modules.workforce.models import Employment

    rows = (
        await session.execute(
            select(Employment.id)
            .where(Employment.current_state.in_(ACTIVE_STATES))
            .order_by(Employment.id)
        )
    ).all()
    return [int(r[0]) for r in rows]


async def resolve_employment_ids(
    session: AsyncSession,
    recipient_type: NotificationRecipientType,
    recipient_id: int,
) -> list[int]:
    """{DEPARTMENT|TEAM|EMPLOYMENT, id} -> active employment_ids (snapshot)."""
    if recipient_type == NotificationRecipientType.EMPLOYMENT:
        return await _active_employment_ids(session, [int(recipient_id)])
    if recipient_type == NotificationRecipientType.DEPARTMENT:
        return await _department_member_ids(session, int(recipient_id))
    if recipient_type == NotificationRecipientType.TEAM:
        return await _team_member_ids(session, int(recipient_id))
    return []


async def _requester_department_id(
    session: AsyncSession, requester_employment_id: int
) -> int | None:
    from app.modules.workforce.models import EmploymentAssignment

    today = date.today()
    row = (
        await session.execute(
            select(EmploymentAssignment.department_id).where(
                EmploymentAssignment.employment_id == requester_employment_id,
                EmploymentAssignment.effective_from <= today,
                (
                    (EmploymentAssignment.effective_to.is_(None))
                    | (EmploymentAssignment.effective_to >= today)
                ),
            )
        )
    ).first()
    return int(row[0]) if row and row[0] is not None else None


async def _department_head_id(session: AsyncSession, department_id: int) -> int | None:
    from app.modules.workforce.department.models import Department

    dept = await session.get(Department, department_id)
    head = getattr(dept, "department_head_employment_id", None)
    return int(head) if head is not None else None


async def _hr_member_ids(
    session: AsyncSession, exclude: set[int]
) -> list[int]:
    from app.modules.workforce.department.models import Department

    dept = (
        await session.execute(
            select(Department).where(Department.name == HR_DEPARTMENT_NAME)
        )
    ).scalar_one_or_none()
    if dept is None:
        return []
    members = await _department_member_ids(session, int(dept.id))
    return [e for e in members if e not in exclude]


async def _admin_member_ids(session: AsyncSession, exclude: set[int]) -> list[int]:
    from app.modules.rbac.models import EmployeeRole, Role

    rows = (
        await session.execute(
            select(EmployeeRole.employment_id)
            .join(Role, Role.id == EmployeeRole.role_id)
            .where(Role.name.in_(SUPER_ADMIN_ROLE_NAMES))
            .order_by(EmployeeRole.employment_id)
        )
    ).all()
    ids = [int(r[0]) for r in rows if int(r[0]) not in exclude]
    return await _active_employment_ids(session, ids)


async def resolve_approver(
    session: AsyncSession, requester_employment_id: int
) -> int | None:
    """Approver chain: dept head -> HR members -> Super Admins (never self)."""
    requester = int(requester_employment_id)
    dept_id = await _requester_department_id(session, requester)
    if dept_id is not None:
        head = await _department_head_id(session, dept_id)
        if head is not None and head != requester:
            active = await _active_employment_ids(session, [head])
            if active:
                return active[0]
    hr = await _hr_member_ids(session, {requester})
    if hr:
        return hr[0]
    admins = await _admin_member_ids(session, {requester})
    if admins:
        return admins[0]
    logger.warning("resolve_approver: no approver found for employment=%s", requester)
    return None
