"""Integration-style scope profile tests for employment and leave_request.

No DB: builds ActorContext + union_scope_names + adapter SQL for:
- SELF-only actor
- TEAM-only actor (team head membership)
- DEPARTMENT-scoped actor
- TEAM + DEPARTMENT grants on same resource+action (union, not collapse)
"""
from __future__ import annotations

from sqlalchemy import select

from app.modules.leave.models import LeaveRequest
from app.modules.rbac.scoping.adapters import EmployeeScopeAdapter, LeaveScopeAdapter
from app.modules.rbac.scoping.resolver import ActorContext, union_scope_names
from app.modules.workforce.models import Employment


def _self_actor() -> ActorContext:
    return ActorContext(
        employment_id=50,
        organization_id=1,
        department_id=None,
        location_id=None,
        team_ids=[],
    )


def _team_head_actor() -> ActorContext:
    return ActorContext(
        employment_id=60,
        organization_id=1,
        department_id=None,
        location_id=None,
        team_ids=[7, 11],
    )


def _department_actor() -> ActorContext:
    return ActorContext(
        employment_id=70,
        organization_id=1,
        department_id=4,
        location_id=None,
        team_ids=[],
    )


def _union_actor() -> ActorContext:
    return ActorContext(
        employment_id=80,
        organization_id=1,
        department_id=4,
        location_id=None,
        team_ids=[7, 11],
    )


def test_self_only_employment_constraint():
    c = union_scope_names(
        resource="employment",
        organization_id=1,
        actor=_self_actor(),
        scope_names=["SELF"],
    )
    assert c is not None
    assert c.employment_ids == [50]
    assert c.team_ids == []
    assert c.department_ids == []
    sql = str(
        EmployeeScopeAdapter()
        .apply(select(Employment), c)
        .compile(compile_kwargs={"literal_binds": True})
    )
    assert "50" in sql


def test_self_only_leave_constraint():
    c = union_scope_names(
        resource="leave_request",
        organization_id=1,
        actor=_self_actor(),
        scope_names=["SELF"],
    )
    assert c is not None
    assert c.employment_ids == [50]
    sql = str(
        LeaveScopeAdapter()
        .apply(select(LeaveRequest), c)
        .compile(compile_kwargs={"literal_binds": True})
    )
    assert "50" in sql


def test_team_only_actor_employment_and_leave():
    actor = _team_head_actor()
    for resource, adapter, model in (
        ("employment", EmployeeScopeAdapter(), Employment),
        ("leave_request", LeaveScopeAdapter(), LeaveRequest),
    ):
        c = union_scope_names(
            resource=resource,
            organization_id=1,
            actor=actor,
            scope_names=["TEAM"],
        )
        assert c is not None
        assert c.team_ids == [7, 11]
        assert c.department_ids == []
        assert c.employment_ids == []
        sql = str(
            adapter.apply(select(model), c).compile(compile_kwargs={"literal_binds": True})
        )
        assert "7" in sql and "11" in sql
        assert "team_members" in sql.lower() or "TeamMember" in sql


def test_department_scoped_actor_employment_and_leave():
    actor = _department_actor()
    for resource, adapter, model in (
        ("employment", EmployeeScopeAdapter(), Employment),
        ("leave_request", LeaveScopeAdapter(), LeaveRequest),
    ):
        c = union_scope_names(
            resource=resource,
            organization_id=1,
            actor=actor,
            scope_names=["DEPARTMENT"],
        )
        assert c is not None
        assert c.department_ids == [4]
        assert c.team_ids == []
        sql = str(
            adapter.apply(select(model), c).compile(compile_kwargs={"literal_binds": True})
        )
        assert "4" in sql
        assert "employment_assignments" in sql.lower() or "EmploymentAssignment" in sql


def test_team_and_department_union_not_collapse():
    """Both grants on same resource+action → department OR team in SQL."""
    actor = _union_actor()
    for resource, adapter, model in (
        ("employment", EmployeeScopeAdapter(), Employment),
        ("leave_request", LeaveScopeAdapter(), LeaveRequest),
    ):
        c = union_scope_names(
            resource=resource,
            organization_id=1,
            actor=actor,
            scope_names=["TEAM", "DEPARTMENT"],
        )
        assert c is not None
        assert c.team_ids == [7, 11], "TEAM must survive alongside DEPARTMENT"
        assert c.department_ids == [4], "DEPARTMENT must survive alongside TEAM"
        assert c.organization_wide is False
        sql = str(
            adapter.apply(select(model), c).compile(compile_kwargs={"literal_binds": True})
        ).upper()
        assert "OR" in sql
        assert "4" in sql
        assert "7" in sql and "11" in sql
