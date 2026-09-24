"""Unit tests for ScopeResolver union logic (no DB).

Covers:
- single grant expansion
- multiple grants same resource+action → UNION (not collapse)
- ORGANIZATION short-circuits narrower fields for create
- zero grants → None / deny create dict
"""
from __future__ import annotations

from app.modules.rbac.scoping.constraint import ScopeConstraint
from app.modules.rbac.scoping.resolver import ActorContext, union_scope_names


def _actor(**kwargs) -> ActorContext:
    base = dict(
        employment_id=10,
        organization_id=1,
        department_id=3,
        location_id=7,
        team_ids=[100, 101],
    )
    base.update(kwargs)
    return ActorContext(**base)


def test_single_self_grant():
    c = union_scope_names(
        resource="leave_request",
        organization_id=1,
        actor=_actor(),
        scope_names=["SELF"],
    )
    assert c is not None
    assert c.employment_ids == [10]
    assert c.team_ids == []
    assert c.department_ids == []
    assert c.organization_wide is False
    assert c.has_access is True


def test_single_team_grant():
    c = union_scope_names(
        resource="employment",
        organization_id=1,
        actor=_actor(),
        scope_names=["TEAM"],
    )
    assert c is not None
    assert c.team_ids == [100, 101]
    assert c.employment_ids == []
    assert c.organization_wide is False


def test_multiple_grants_union_not_collapse():
    """TEAM + DEPARTMENT on same resource+action must keep both sets."""
    c = union_scope_names(
        resource="employment",
        organization_id=1,
        actor=_actor(department_id=3, team_ids=[100, 101]),
        scope_names=["TEAM", "DEPARTMENT"],
    )
    assert c is not None
    assert c.team_ids == [100, 101]
    assert c.department_ids == [3]
    assert c.organization_wide is False
    # Must not drop TEAM because DEPARTMENT is "broader"
    assert c.team_ids, "TEAM grant must survive alongside DEPARTMENT"


def test_organization_grant_sets_organization_wide():
    c = union_scope_names(
        resource="user",
        organization_id=1,
        actor=_actor(),
        scope_names=["ORGANIZATION", "TEAM", "SELF"],
    )
    assert c is not None
    assert c.organization_wide is True
    # Narrower expansions still present (informational); filters short-circuit on flag
    assert c.team_ids == [100, 101]
    assert c.employment_ids == [10]


def test_zero_grants_returns_none():
    c = union_scope_names(
        resource="payroll",
        organization_id=1,
        actor=_actor(),
        scope_names=[],
    )
    assert c is None


def test_location_and_department_union():
    c = union_scope_names(
        resource="attendance",
        organization_id=1,
        actor=_actor(department_id=5, location_id=9),
        scope_names=["LOCATION", "DEPARTMENT"],
    )
    assert c is not None
    assert c.location_ids == [9]
    assert c.department_ids == [5]


def test_scope_for_create_shape_from_constraint_org_wide():
    """Mirrors ScopeResolver.scope_for_create when organization_wide."""
    c = union_scope_names(
        resource="employment",
        organization_id=1,
        actor=_actor(),
        scope_names=["ORGANIZATION"],
    )
    assert isinstance(c, ScopeConstraint)
    create = {
        "organization_id": c.organization_id,
        "department_ids": [] if c.organization_wide else list(c.department_ids),
        "location_ids": [] if c.organization_wide else list(c.location_ids),
        "team_ids": [] if c.organization_wide else list(c.team_ids),
        "employment_ids": [] if c.organization_wide else list(c.employment_ids),
        "organization_wide": c.organization_wide,
        "unrestricted": c.organization_wide,
    }
    assert create["unrestricted"] is True
    assert create["department_ids"] == []
    assert create["team_ids"] == []


def test_scope_for_create_narrow_grants_keep_lists():
    c = union_scope_names(
        resource="employment",
        organization_id=1,
        actor=_actor(department_id=3, team_ids=[42]),
        scope_names=["TEAM", "DEPARTMENT"],
    )
    assert c is not None
    create = {
        "organization_id": c.organization_id,
        "department_ids": [] if c.organization_wide else list(c.department_ids),
        "location_ids": [] if c.organization_wide else list(c.location_ids),
        "team_ids": [] if c.organization_wide else list(c.team_ids),
        "employment_ids": [] if c.organization_wide else list(c.employment_ids),
        "organization_wide": c.organization_wide,
        "unrestricted": c.organization_wide,
    }
    assert create["unrestricted"] is False
    assert create["department_ids"] == [3]
    assert create["team_ids"] == [42]
