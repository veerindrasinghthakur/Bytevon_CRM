"""
ScopeResolver — translate role_permission grants into concrete ID sets.

Rules:
- Load ALL grants for actor's roles matching resource + action (multi-row OK).
- Translate each scope name to concrete values from ActorContext.
- UNION across grants; do NOT collapse to a single broadest scope.
- ORGANIZATION sets organization_wide=True (narrower sets still collected but
  list filters should short-circuit when organization_wide is set).
- Zero grants → None (no access).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import Action
from app.modules.project.team.models import TeamMember
from app.modules.rbac.models import (
    EmployeeRole,
    Permission,
    Resource,
    RolePermission,
    Scope,
)
from app.modules.rbac.scoping.constraint import ScopeConstraint
from app.modules.workforce.models import EmploymentAssignment


@dataclass
class ActorContext:
    """Snapshot of the actor used to expand symbolic scopes."""

    employment_id: int
    organization_id: Optional[int] = None
    department_id: Optional[int] = None
    location_id: Optional[int] = None
    team_ids: list[int] = field(default_factory=list)


def union_scope_names(
    *,
    resource: str,
    organization_id: Optional[int],
    actor: ActorContext,
    scope_names: Sequence[str],
) -> Optional[ScopeConstraint]:
    """
    Pure union of translated scope names (unit-testable without DB).

    Returns None when scope_names is empty (no matching grants).
    """
    if not scope_names:
        return None

    dept: set[int] = set()
    loc: set[int] = set()
    teams: set[int] = set()
    emps: set[int] = set()
    organization_wide = False

    for raw in scope_names:
        name = (raw.value if hasattr(raw, "value") else str(raw)).upper()
        if name == "ORGANIZATION":
            organization_wide = True
        elif name == "SELF":
            emps.add(actor.employment_id)
        elif name == "TEAM":
            teams.update(actor.team_ids)
        elif name == "DEPARTMENT":
            if actor.department_id is not None:
                dept.add(actor.department_id)
        elif name == "LOCATION":
            if actor.location_id is not None:
                loc.add(actor.location_id)
        # CUSTOM: no automatic expansion (empty contribution)

    return ScopeConstraint(
        resource=resource,
        organization_id=organization_id,
        department_ids=sorted(dept),
        location_ids=sorted(loc),
        team_ids=sorted(teams),
        employment_ids=sorted(emps),
        organization_wide=organization_wide,
    )


class ScopeResolver:
    """
    Resolve data-boundary constraints from RBAC grants.

    Does not mutate get_effective_permissions; that remains FE visibility only.
    """

    def __init(
        self,
        session: AsyncSession,
        *,
        organization_id: Optional[int] = 1,
    ) -> None:
        self._session = session
        self._organization_id = organization_id

    def __init__(
        self,
        session: AsyncSession,
        *,
        organization_id: Optional[int] = 1,
    ) -> None:
        self._session = session
        self._organization_id = organization_id

    async def load_actor_context(self, employment_id: int) -> ActorContext:
        """Current assignment + active team memberships for the employment."""
        as_of = date.today()
        stmt = (
            select(EmploymentAssignment)
            .where(
                EmploymentAssignment.employment_id == employment_id,
                EmploymentAssignment.effective_from <= as_of,
                (EmploymentAssignment.effective_to.is_(None))
                | (EmploymentAssignment.effective_to >= as_of),
            )
            .order_by(EmploymentAssignment.effective_from.desc())
            .limit(1)
        )
        assignment = (await self._session.execute(stmt)).scalar_one_or_none()

        team_stmt = select(TeamMember.team_id).where(
            TeamMember.employment_id == employment_id,
            TeamMember.left_at.is_(None),
        )
        team_ids = list((await self._session.execute(team_stmt)).scalars().all())

        return ActorContext(
            employment_id=employment_id,
            organization_id=self._organization_id,
            department_id=assignment.department_id if assignment else None,
            location_id=assignment.location_id if assignment else None,
            team_ids=[int(t) for t in team_ids],
        )

    async def _scope_names_for(
        self,
        employment_id: int,
        resource: str,
        action: str | Action,
    ) -> list[str]:
        action_val = action.value if isinstance(action, Action) else str(action).upper()
        try:
            action_enum = Action(action_val)
        except ValueError:
            return []

        stmt = (
            select(Scope.name)
            .select_from(EmployeeRole)
            .join(RolePermission, RolePermission.role_id == EmployeeRole.role_id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .join(Resource, Resource.id == Permission.resource_id)
            .join(Scope, Scope.id == RolePermission.scope_id)
            .where(
                EmployeeRole.employment_id == employment_id,
                Resource.name == resource,
                Permission.action == action_enum,
            )
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [str(n) for n in rows]

    async def resolve(
        self,
        actor: int | ActorContext,
        resource: str,
        action: str,
    ) -> Optional[ScopeConstraint]:
        """
        Resolve constraint for resource + action.

        Returns None when the actor has no matching grants (deny).
        """
        if isinstance(actor, ActorContext):
            ctx = actor
            employment_id = ctx.employment_id
        else:
            employment_id = int(actor)
            ctx = await self.load_actor_context(employment_id)

        scope_names = await self._scope_names_for(employment_id, resource, action)
        return union_scope_names(
            resource=resource,
            organization_id=ctx.organization_id or self._organization_id,
            actor=ctx,
            scope_names=scope_names,
        )

    async def scope_for_create(
        self,
        actor: int | ActorContext,
        resource: str,
    ) -> dict:
        """
        Allowed FK values for a new row under CREATE grants.

        Keys: organization_id, department_ids, location_ids, team_ids,
        employment_ids, organization_wide, unrestricted (True when org-wide).
        Empty grants → no access (organization_wide=False, all lists empty).
        """
        constraint = await self.resolve(actor, resource, Action.CREATE.value)
        if constraint is None:
            return {
                "organization_id": self._organization_id,
                "department_ids": [],
                "location_ids": [],
                "team_ids": [],
                "employment_ids": [],
                "organization_wide": False,
                "unrestricted": False,
            }
        return {
            "organization_id": constraint.organization_id,
            "department_ids": [] if constraint.organization_wide else list(constraint.department_ids),
            "location_ids": [] if constraint.organization_wide else list(constraint.location_ids),
            "team_ids": [] if constraint.organization_wide else list(constraint.team_ids),
            "employment_ids": [] if constraint.organization_wide else list(constraint.employment_ids),
            "organization_wide": constraint.organization_wide,
            "unrestricted": constraint.organization_wide,
        }
