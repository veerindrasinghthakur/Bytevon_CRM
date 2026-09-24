"""Unit tests for ScopeAdapter clause building (no DB required).

Confirms department_ids ∪ team_ids produces OR — not a single-set filter.
"""
from __future__ import annotations

from sqlalchemy import select

from app.modules.leave.models import LeaveRequest
from app.modules.rbac.scoping.adapters import (
    EmployeeScopeAdapter,
    LeaveScopeAdapter,
    SCOPE_ADAPTERS,
    apply_scope,
    build_employment_scope_predicate,
    get_scope_adapter,
)
from app.modules.rbac.scoping.constraint import ScopeConstraint
from app.modules.workforce.models import Employment


def test_registry_keys_match_resource_names():
    assert "employment" in SCOPE_ADAPTERS
    assert "leave_request" in SCOPE_ADAPTERS
    assert get_scope_adapter("employment") is not None
    assert get_scope_adapter("leave_request") is not None
    assert get_scope_adapter("unknown_resource") is None


def test_union_department_and_team_predicate_uses_or():
    """department_ids=[4] and team_ids=[7,11] → both appear under OR."""
    constraint = ScopeConstraint(
        resource="employment",
        organization_id=1,
        department_ids=[4],
        team_ids=[7, 11],
        organization_wide=False,
    )
    pred = build_employment_scope_predicate(Employment.id, constraint)
    assert pred is not None
    sql = str(pred.compile(compile_kwargs={"literal_binds": True}))
    # Must mention department 4 and teams 7/11 (not only one side)
    assert "4" in sql
    assert "7" in sql and "11" in sql
    # SQLAlchemy renders OR as or_ / OR
    assert "OR" in sql.upper()


def test_employee_adapter_apply_embeds_union_or():
    constraint = ScopeConstraint(
        resource="employment",
        organization_id=1,
        department_ids=[4],
        team_ids=[7, 11],
    )
    stmt = select(Employment)
    filtered = EmployeeScopeAdapter().apply(stmt, constraint)
    sql = str(filtered.compile(compile_kwargs={"literal_binds": True}))
    assert "4" in sql
    assert "7" in sql and "11" in sql
    assert "OR" in sql.upper()
    # Team membership and assignment paths both present
    assert "team_members" in sql.lower() or "TeamMember" in sql
    assert "employment_assignments" in sql.lower() or "EmploymentAssignment" in sql


def test_leave_adapter_filters_via_employment_id():
    constraint = ScopeConstraint(
        resource="leave_request",
        organization_id=1,
        department_ids=[4],
        team_ids=[7, 11],
    )
    stmt = select(LeaveRequest)
    filtered = LeaveScopeAdapter().apply(stmt, constraint)
    sql = str(filtered.compile(compile_kwargs={"literal_binds": True}))
    assert "4" in sql
    assert "7" in sql and "11" in sql
    assert "OR" in sql.upper()


def test_organization_wide_leaves_query_unchanged():
    constraint = ScopeConstraint(
        resource="employment",
        organization_id=1,
        department_ids=[4],
        team_ids=[7],
        organization_wide=True,
    )
    stmt = select(Employment)
    filtered = EmployeeScopeAdapter().apply(stmt, constraint)
    # No WHERE added for org-wide
    assert filtered.whereclause is None


def test_apply_scope_helper_uses_registry():
    constraint = ScopeConstraint(
        resource="employment",
        department_ids=[4],
        team_ids=[7, 11],
    )
    stmt = select(Employment)
    filtered = apply_scope(stmt, constraint)
    sql = str(filtered.compile(compile_kwargs={"literal_binds": True}))
    assert "OR" in sql.upper()
    assert "4" in sql and "7" in sql
