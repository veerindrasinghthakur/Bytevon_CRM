"""
Scope adapters — apply ScopeConstraint to SQLAlchemy Select queries.

Registry keyed by resources.name so callers do:
    adapter = get_scope_adapter(resource)
    stmt = adapter.apply(stmt, constraint)

Union semantics: department OR location OR team OR self employment_ids.
organization_wide → no extra WHERE (unrestricted within org).
"""

from __future__ import annotations

from datetime import date
from typing import Optional, Protocol, runtime_checkable

from sqlalchemy import Select, and_, exists, or_, select
from sqlalchemy.sql import ColumnElement

from app.modules.project.team.models import TeamMember
from app.modules.rbac.scoping.constraint import ScopeConstraint
from app.modules.workforce.models import Employment, EmploymentAssignment


@runtime_checkable
class ScopeAdapter(Protocol):
    """Filter a Select for one resource using a resolved ScopeConstraint."""

    resource: str

    def apply(self, query: Select, constraint: ScopeConstraint) -> Select:
        """Return query with scope predicates applied (or unchanged if org-wide)."""
        ...


def _current_assignment_match(
    employment_id_col: ColumnElement,
    *,
    department_ids: list[int],
    location_ids: list[int],
    as_of: Optional[date] = None,
) -> Optional[ColumnElement]:
    """EXISTS current EmploymentAssignment matching department and/or location."""
    as_of = as_of or date.today()
    clauses: list[ColumnElement] = []
    if department_ids:
        clauses.append(EmploymentAssignment.department_id.in_(department_ids))
    if location_ids:
        clauses.append(EmploymentAssignment.location_id.in_(location_ids))
    if not clauses:
        return None

    return exists(
        select(1)
        .select_from(EmploymentAssignment)
        .where(
            EmploymentAssignment.employment_id == employment_id_col,
            EmploymentAssignment.effective_from <= as_of,
            (EmploymentAssignment.effective_to.is_(None))
            | (EmploymentAssignment.effective_to >= as_of),
            or_(*clauses),
        )
    )


def _team_membership_match(
    employment_id_col: ColumnElement,
    team_ids: list[int],
) -> Optional[ColumnElement]:
    if not team_ids:
        return None
    return exists(
        select(1)
        .select_from(TeamMember)
        .where(
            TeamMember.employment_id == employment_id_col,
            TeamMember.left_at.is_(None),
            TeamMember.team_id.in_(team_ids),
        )
    )


def build_employment_scope_predicate(
    employment_id_col: ColumnElement,
    constraint: ScopeConstraint,
    *,
    as_of: Optional[date] = None,
) -> Optional[ColumnElement]:
    """
    OR of self / department / location / team predicates for an employment id column.

    Returns None when organization_wide (caller applies no filter).
    Returns a false-ish predicate when constraint has no IDs (deny-all).
    """
    if constraint.organization_wide:
        return None

    parts: list[ColumnElement] = []

    if constraint.employment_ids:
        parts.append(employment_id_col.in_(constraint.employment_ids))

    asg = _current_assignment_match(
        employment_id_col,
        department_ids=list(constraint.department_ids),
        location_ids=list(constraint.location_ids),
        as_of=as_of,
    )
    if asg is not None:
        parts.append(asg)

    team = _team_membership_match(employment_id_col, list(constraint.team_ids))
    if team is not None:
        parts.append(team)

    if not parts:
        # No concrete IDs → no rows
        return employment_id_col.in_(())

    return or_(*parts)


class EmployeeScopeAdapter:
    """Filter Employment queries by resolved scope (union OR)."""

    resource = "employment"

    def apply(self, query: Select, constraint: ScopeConstraint) -> Select:
        if constraint.organization_wide:
            return query
        pred = build_employment_scope_predicate(Employment.id, constraint)
        if pred is None:
            return query
        return query.where(pred)


class LeaveScopeAdapter:
    """Filter LeaveRequest queries via employment → assignment / team (union OR)."""

    resource = "leave_request"

    def apply(self, query: Select, constraint: ScopeConstraint) -> Select:
        # Local import avoids circular import at package load if leave pulls rbac later.
        from app.modules.leave.models import LeaveRequest

        if constraint.organization_wide:
            return query
        pred = build_employment_scope_predicate(LeaveRequest.employment_id, constraint)
        if pred is None:
            return query
        return query.where(pred)


# resources.name → adapter instance (extend here for new resources)
SCOPE_ADAPTERS: dict[str, ScopeAdapter] = {
    EmployeeScopeAdapter.resource: EmployeeScopeAdapter(),
    LeaveScopeAdapter.resource: LeaveScopeAdapter(),
}


def get_scope_adapter(resource: str) -> Optional[ScopeAdapter]:
    """Lookup adapter by resources table name; None if not registered."""
    return SCOPE_ADAPTERS.get(resource)


def apply_scope(query: Select, constraint: ScopeConstraint) -> Select:
    """Apply the registered adapter for constraint.resource, or return query unchanged."""
    adapter = get_scope_adapter(constraint.resource)
    if adapter is None:
        return query
    return adapter.apply(query, constraint)
