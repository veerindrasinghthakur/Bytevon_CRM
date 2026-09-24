"""Unit tests for LeaveApproveRelationshipPolicy (no DB for logic table)."""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core.db.enums import ApprovalStatus, ApprovalTarget
from app.modules.rbac.scoping.relationships import (
    LeaveApproveRelationshipPolicy,
    get_relationship_policy,
)


def test_registry_has_leave_approve():
    p = get_relationship_policy("leave_request", "APPROVE")
    assert p is not None
    assert isinstance(p, LeaveApproveRelationshipPolicy)


@pytest.mark.asyncio
async def test_not_pending_fails(monkeypatch):
    policy = LeaveApproveRelationshipPolicy()
    req = SimpleNamespace(
        request_type="LEAVE_REQUEST",
        status=ApprovalStatus.APPROVED,
        requester_employment_id=2,
        target=ApprovalTarget.DEPARTMENT_HEAD,
        target_department_id=1,
    )

    class _S:
        async def get(self, model, pk):
            return None

    assert (
        await policy.check(
            _S(),  # type: ignore[arg-type]
            actor_employment_id=1,
            resource="leave_request",
            action="APPROVE",
            target=req,
        )
        is False
    )


@pytest.mark.asyncio
async def test_requester_cannot_approve():
    policy = LeaveApproveRelationshipPolicy()
    req = SimpleNamespace(
        request_type="LEAVE_REQUEST",
        status=ApprovalStatus.PENDING,
        requester_employment_id=10,
        target=ApprovalTarget.DEPARTMENT_HEAD,
        target_department_id=1,
    )

    class _S:
        async def get(self, model, pk):
            return SimpleNamespace(department_head_employment_id=10)

    assert (
        await policy.check(
            _S(),  # type: ignore[arg-type]
            actor_employment_id=10,
            resource="leave_request",
            action="APPROVE",
            target=req,
        )
        is False
    )


@pytest.mark.asyncio
async def test_department_head_match_succeeds():
    policy = LeaveApproveRelationshipPolicy()
    req = SimpleNamespace(
        request_type="LEAVE_REQUEST",
        status=ApprovalStatus.PENDING,
        requester_employment_id=2,
        target=ApprovalTarget.DEPARTMENT_HEAD,
        target_department_id=5,
    )

    class _S:
        async def get(self, model, pk):
            assert pk == 5
            return SimpleNamespace(department_head_employment_id=99)

    assert (
        await policy.check(
            _S(),  # type: ignore[arg-type]
            actor_employment_id=99,
            resource="leave_request",
            action="APPROVE",
            target=req,
        )
        is True
    )


@pytest.mark.asyncio
async def test_wrong_head_fails():
    policy = LeaveApproveRelationshipPolicy()
    req = SimpleNamespace(
        request_type="LEAVE_REQUEST",
        status=ApprovalStatus.PENDING,
        requester_employment_id=2,
        target=ApprovalTarget.DEPARTMENT_HEAD,
        target_department_id=5,
    )

    class _S:
        async def get(self, model, pk):
            return SimpleNamespace(department_head_employment_id=99)

    assert (
        await policy.check(
            _S(),  # type: ignore[arg-type]
            actor_employment_id=1,
            resource="leave_request",
            action="APPROVE",
            target=req,
        )
        is False
    )
