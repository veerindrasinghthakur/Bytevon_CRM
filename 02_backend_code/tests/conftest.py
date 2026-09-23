"""Shared pytest fixtures for the ByteVon testing program.

Isolation model (TASK-012): SERIAL execution, no pytest-xdist. Before every
test, all DATA tables are TRUNCATEd (RESTART IDENTITY CASCADE); seed-catalog
tables (resources, permissions, scopes, sensitive_fields, alembic_version)
are preserved. Tests build actors/data through deterministic factories.

SAFETY: the session aborts unless DATABASE_URL points at `bytevon_test`.
"""
from __future__ import annotations

import itertools
import os
from datetime import date

import pytest
from sqlalchemy import select, text

_db_url = os.environ.get("DATABASE_URL", "")
if "bytevon_test" not in _db_url:
    raise RuntimeError(
        "Refusing to run tests: set DATABASE_URL to the bytevon_test database "
        f"(got {_db_url!r})"
    )

from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.core.db.enums import Action, EmploymentState, EmploymentType  # noqa: E402
from app.core.models_registry import Base  # noqa: E402
from app.core.security.password_manager import PasswordManager  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.auth.models import Login, Person  # noqa: E402
from app.modules.leave.models import LeaveType  # noqa: E402
from app.modules.rbac.models import (  # noqa: E402
    EmployeeRole,
    Permission,
    Resource,
    Role,
    RolePermission,
    Scope,
)
from app.modules.workforce.models import Employment  # noqa: E402

TEST_PASSWORD = "Testpass123!"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "ChangeMeAdmin!123"

# Seed-catalog tables preserved across truncate (TASK-012).
PRESERVE_TABLES = frozenset(
    {"alembic_version", "resources", "permissions", "scopes", "sensitive_fields"}
)

_counter = itertools.count(1)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def _portal(client, coro_factory, *args):
    """Run async work on the TestClient portal loop (asyncpg loop affinity)."""
    return client.portal.call(coro_factory, *args)


async def _truncate() -> None:
    tables = sorted(set(Base.metadata.tables) - PRESERVE_TABLES)
    quoted = ", ".join(tables)
    async with AsyncSessionLocal() as session:
        await session.execute(text(f"TRUNCATE {quoted} RESTART IDENTITY CASCADE"))
        await session.commit()


async def _reseed_base() -> None:
    """Lean per-test reseed: Super Admin identity + role (catalog preserved).

    Full bootstrap is too slow per-test (~200 idempotent checks); tests build
    everything else through factories.
    """
    pwd = PasswordManager()
    async with AsyncSessionLocal() as session:
        person = Person(first_name="System", last_name="Admin")
        session.add(person)
        await session.flush()
        session.add(
            Login(
                person_id=person.id,
                email=ADMIN_EMAIL,
                password_hash=pwd.hash(ADMIN_PASSWORD),
                is_active=True,
                failed_attempt_count=0,
            )
        )
        await session.flush()
        session.add(
            Employment(
                person_id=person.id,
                employee_code="SYS-001",
                employment_type=EmploymentType.FULL_TIME,
                current_state=EmploymentState.CONFIRMED,
                joining_date=date.today(),
                changed_by=1,
            )
        )
        await session.flush()
        emp_id = (
            await session.execute(
                select(Employment.id).where(Employment.employee_code == "SYS-001")
            )
        ).scalar_one()
        role = Role(
            name="Super Admin",
            description="Full system access",
            is_system_role=True,
            changed_by=1,
        )
        session.add(role)
        await session.flush()
        session.add(EmployeeRole(employment_id=emp_id, role_id=role.id, changed_by=1))
        # Leave type master catalog (mirrors m3n4o5p6q7r8 seed).
        for order, (code, name, paid, doc, encash, days) in enumerate(
            [
                ("CASUAL", "Casual", True, False, False, "12"),
                ("SICK", "Sick", True, True, False, "12"),
                ("EARNED", "Earned", True, False, True, "15"),
                ("MATERNITY", "Maternity", True, True, False, "182"),
                ("PATERNITY", "Paternity", True, False, False, "15"),
                ("LOSS_OF_PAY", "Unpaid", False, False, False, "0"),
                ("COMP_OFF", "Comp Off", True, False, False, "0"),
            ]
        ):
            session.add(
                LeaveType(
                    code=code,
                    name=name,
                    is_paid=paid,
                    requires_document=doc,
                    is_encashable=encash,
                    default_annual_entitlement=days,
                    sort_order=order,
                )
            )
        await session.commit()


@pytest.fixture(autouse=True)
def clean_db(client):
    """Per-test isolation: wipe data tables, restart identities (TASK-012)."""
    _portal(client, _truncate)
    _portal(client, _reseed_base)
    yield
    _portal(client, _truncate)


async def _make_actor(session, tag: str) -> dict:
    n = next(_counter)
    first, last = f"T{tag}", f"User{n}"
    email = f"t{tag.lower()}.user{n}@example.com"
    code = f"T-{tag.upper()}-{n:04d}"
    pwd = PasswordManager()
    person = Person(first_name=first, last_name=last)
    session.add(person)
    await session.flush()
    login = Login(
        person_id=person.id,
        email=email,
        password_hash=pwd.hash(TEST_PASSWORD),
        is_active=True,
        failed_attempt_count=0,
    )
    session.add(login)
    await session.flush()
    emp = Employment(
        person_id=person.id,
        employee_code=code,
        employment_type=EmploymentType.FULL_TIME,
        current_state=EmploymentState.CONFIRMED,
        joining_date=date(2024, 6, 1),
        changed_by=1,
    )
    session.add(emp)
    await session.flush()
    await session.commit()
    return {
        "employment_id": emp.id,
        "login_id": login.id,
        "person_id": person.id,
        "email": email,
        "password": TEST_PASSWORD,
        "code": code,
    }


async def _make_role(session, name: str, grants: list[tuple[str, str, str]]) -> int:
    role = (
        await session.execute(select(Role).where(Role.name == name))
    ).scalar_one_or_none()
    if role is None:
        role = Role(name=name, description=f"test role {name}", changed_by=1)
        session.add(role)
        await session.flush()
    for resource_name, action_name, scope_name in grants:
        resource = (
            await session.execute(select(Resource).where(Resource.name == resource_name))
        ).scalar_one()
        perm = (
            await session.execute(
                select(Permission).where(
                    Permission.resource_id == resource.id,
                    Permission.action == Action[action_name],
                )
            )
        ).scalar_one()
        scope = (
            await session.execute(select(Scope).where(Scope.name == scope_name))
        ).scalar_one()
        existing = (
            await session.execute(
                select(RolePermission).where(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == perm.id,
                    RolePermission.scope_id == scope.id,
                )
            )
        ).scalar_one_or_none()
        if existing is None:
            session.add(
                RolePermission(
                    role_id=role.id,
                    permission_id=perm.id,
                    scope_id=scope.id,
                    changed_by=1,
                )
            )
    await session.flush()
    await session.commit()
    return role.id


async def _assign_role(session, employment_id: int, role_id: int) -> None:
    existing = (
        await session.execute(
            select(EmployeeRole).where(
                EmployeeRole.employment_id == employment_id,
                EmployeeRole.role_id == role_id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        session.add(
            EmployeeRole(employment_id=employment_id, role_id=role_id, changed_by=1)
        )
        await session.commit()


class ActorFactory:
    """Deterministic test-data factory (TASK-013). No randomness."""

    def __init__(self, client):
        self.client = client

    def actor(self, tag: str = "u", grants: list[tuple[str, str, str]] | None = None,
              role_name: str | None = None) -> dict:
        async def _run():
            async with AsyncSessionLocal() as session:
                info = await _make_actor(session, tag)
                if grants:
                    rid = await _make_role(session, role_name or f"Role {tag}", grants)
                    await _assign_role(session, info["employment_id"], rid)
                    info["role_id"] = rid
                return info

        info = _portal(self.client, _run)
        resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": info["email"], "password": TEST_PASSWORD},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body.get("employment_id") is not None, "SEC-001: employment_id missing"
        info["headers"] = {
            "Authorization": f"Bearer {body['tokens']['access_token']}"
        }
        return info

    def super_admin(self) -> dict:
        """Real Super Admin session (seeded employment 1)."""
        resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        return {
            "employment_id": body.get("employment_id") or 1,
            "login_id": body.get("login_id"),
            "headers": {"Authorization": f"Bearer {body['tokens']['access_token']}"},
        }

    def leave_for(self, owner: dict, **overrides) -> dict:
        """Approved-flow leave + linked approval owned by `owner` (via SA)."""
        sa = self.super_admin()
        payload = {
            "employment_id": owner["employment_id"],
            "leave_type": "LOSS_OF_PAY",
            # Monday: canonical working-day count requires a working day
            "start_date": "2030-01-07",
            "end_date": "2030-01-07",
            "reason": "probe leave",
        }
        payload.update(overrides)
        resp = self.client.post(
            "/api/v1/leave/requests", json=payload, headers=sa["headers"]
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["approval_request_id"] is not None
        return {"leave_id": body["id"], "approval_id": body["approval_request_id"]}

    def salary_for(self, owner: dict) -> dict:
        sa = self.super_admin()
        resp = self.client.post(
            "/api/v1/payroll/salaries",
            json={
                "employment_id": owner["employment_id"],
                "effective_from": "2026-01-01",
                "gross_salary": "120000.00",
                "items": [{"name": "Basic", "type": "EARNING", "amount": "120000.00"}],
            },
            headers=sa["headers"],
        )
        assert resp.status_code in (200, 201), resp.text
        return {"salary_id": resp.json()["id"]}

    def synthetic_headers(self, **claims) -> dict:
        """LABELED SYNTHETIC JWTs for negative tests (TASK-015).

        Hand-crafted claims (never from login); the steps that build them are
        explicit in each test so a passing suite can never hide a SEC-001
        regression (real logins are asserted to carry employment_id above).
        """
        from app.core.security.jwt_manager import JWTManager

        base = {
            "login_id": claims.get("login_id", 0),
            "person_id": claims.get("person_id", 0),
            "employment_id": claims.get("employment_id"),
        }
        token = JWTManager().generate_access_token(**base)
        return {"Authorization": f"Bearer {token}", "X-Synthetic": "true"}


@pytest.fixture
def factory(client):
    return ActorFactory(client)


@pytest.fixture
def sa(client):
    return ActorFactory(client).super_admin()
