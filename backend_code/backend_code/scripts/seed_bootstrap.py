"""
Bootstrap seed: system employment + super-admin person/login/role.

Run after migrations:
  cd backend_code && python -m scripts.seed_bootstrap

Idempotent where possible.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import date, datetime, timezone

from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.db.enums import Action, EmploymentState, EmploymentType, ScopeName
from app.core.security.password_manager import PasswordManager
from app.modules.authentication.models import Login, Person
from app.modules.employment.models import Employment, Position
from app.modules.organization.models import Department, OrganizationSettings
from app.modules.rbac.models import EmployeeRole, Permission, Resource, Role, RolePermission, Scope

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

ADMIN_EMAIL = "admin@bytevon.local"
ADMIN_PASSWORD = "ChangeMeAdmin!123"
SYSTEM_EMP_ID = settings.SYSTEM_EMPLOYMENT_ID



# FE-aligned resource names (shared/schema ResourceName)
RBAC_RESOURCE_SEED = [
    ("employment", "Employees / employments"),
    ("department", "Departments"),
    ("location", "Office locations"),
    ("role", "Roles & permissions"),
    ("user", "Login users"),
    ("leave_request", "Leave requests"),
    ("leave_policy", "Leave policies"),
    ("attendance", "Attendance"),
    ("payroll", "Payroll runs"),
    ("salary", "Salary configuration"),
    ("project", "Projects"),
    ("task", "Tasks"),
    ("lead", "Sales leads"),
    ("client", "Clients"),
    ("approval", "Approvals"),
    ("audit", "Audit logs"),
    ("notification", "Notifications"),
    ("org_settings", "Organization settings"),
    ("shift", "Shifts"),
    ("holiday", "Holidays"),
    ("document", "Documents"),
    ("note", "Notes"),
]

SCOPE_SEED = [
    (ScopeName.SELF, "Own records only"),
    (ScopeName.TEAM, "Team members"),
    (ScopeName.DEPARTMENT, "Department"),
    (ScopeName.LOCATION, "Location"),
    (ScopeName.ORGANIZATION, "Entire organization"),
]


async def seed_rbac_catalog(session) -> None:
    """Idempotent resources, scopes, permissions matching frontend ResourceName."""
    for name, desc in SCOPE_SEED:
        existing = (
            await session.execute(select(Scope).where(Scope.name == name.value))
        ).scalar_one_or_none()
        if existing is None:
            session.add(Scope(name=name.value, description=desc))
    await session.flush()

    for name, desc in RBAC_RESOURCE_SEED:
        existing = (
            await session.execute(select(Resource).where(Resource.name == name))
        ).scalar_one_or_none()
        if existing is None:
            session.add(Resource(name=name, description=desc))
    await session.flush()

    resources = (await session.execute(select(Resource))).scalars().all()
    for res in resources:
        for action in Action:
            existing = (
                await session.execute(
                    select(Permission).where(
                        Permission.resource_id == res.id,
                        Permission.action == action,
                    )
                )
            ).scalar_one_or_none()
            if existing is None:
                session.add(Permission(resource_id=res.id, action=action))
    await session.flush()
    logger.info("RBAC catalog seeded (%s resources, all actions including UNLOCK)", len(resources))


async def seed() -> None:
    pwd = PasswordManager()
    async with AsyncSessionLocal() as session:
        await seed_rbac_catalog(session)
        # --- Organization settings singleton ---
        existing_org = (
            await session.execute(select(OrganizationSettings).limit(1))
        ).scalar_one_or_none()
        if existing_org is None:
            org = OrganizationSettings(
                company_name="ByteVon",
                default_timezone="Asia/Kolkata",
                default_currency="INR",
            )
            session.add(org)
            logger.info("Created organization_settings")

        # --- Root department ---
        dept = (
            await session.execute(
                select(Department).where(Department.name == "Administration")
            )
        ).scalar_one_or_none()
        if dept is None:
            dept = Department(name="Administration")
            session.add(dept)
            await session.flush()
            logger.info("Created department Administration id=%s", dept.id)

        # --- Position ---
        pos = (
            await session.execute(
                select(Position).where(Position.name == "System Administrator")
            )
        ).scalar_one_or_none()
        if pos is None:
            pos = Position(name="System Administrator")
            session.add(pos)
            await session.flush()
            logger.info("Created position id=%s", pos.id)

        # --- Person + Login for super-admin ---
        person = (
            await session.execute(
                select(Person).where(
                    Person.first_name == "System", Person.last_name == "Admin"
                )
            )
        ).scalar_one_or_none()
        if person is None:
            person = Person(first_name="System", last_name="Admin")
            session.add(person)
            await session.flush()
            logger.info("Created person id=%s", person.id)

        login = (
            await session.execute(select(Login).where(Login.email == ADMIN_EMAIL))
        ).scalar_one_or_none()
        if login is None:
            login = Login(
                person_id=person.id,
                email=ADMIN_EMAIL,
                password_hash=pwd.hash(ADMIN_PASSWORD),
                is_active=True,
                failed_attempt_count=0,
            )
            session.add(login)
            await session.flush()
            logger.info("Created login id=%s email=%s", login.id, ADMIN_EMAIL)
        else:
            logger.info("Login already exists for %s", ADMIN_EMAIL)

        # --- Employment with fixed SYSTEM_EMPLOYMENT_ID ---
        emp = (
            await session.execute(
                select(Employment).where(Employment.id == SYSTEM_EMP_ID)
            )
        ).scalar_one_or_none()
        if emp is None:
            # Insert with explicit id (PostgreSQL identity still allows override)
            emp_type = EmploymentType.FULL_TIME
            emp_state = EmploymentState.CONFIRMED
            emp = Employment(
                id=SYSTEM_EMP_ID,
                person_id=person.id,
                employee_code="SYS-001",
                employment_type=emp_type,
                current_state=emp_state,
                joining_date=date.today(),
                changed_by=SYSTEM_EMP_ID,
            )
            session.add(emp)
            await session.flush()
            # Ensure sequence is past SYSTEM_EMP_ID
            try:
                await session.execute(
                    text(
                        "SELECT setval(pg_get_serial_sequence('employments', 'id'), "
                        "GREATEST((SELECT MAX(id) FROM employments), 1))"
                    )
                )
            except Exception:
                logger.warning("Could not advance employments id sequence (non-fatal)")
            logger.info("Created system employment id=%s", emp.id)
        else:
            logger.info("System employment id=%s already exists", SYSTEM_EMP_ID)

        # --- Super-Admin role ---
        role = (
            await session.execute(select(Role).where(Role.name == "Super Admin"))
        ).scalar_one_or_none()
        if role is None:
            role = Role(
                name="Super Admin",
                description="Full system access",
                is_system_role=True,
                changed_by=SYSTEM_EMP_ID,
            )
            session.add(role)
            await session.flush()
            logger.info("Created role Super Admin id=%s", role.id)

        existing_er = (
            await session.execute(
                select(EmployeeRole).where(
                    EmployeeRole.employment_id == SYSTEM_EMP_ID,
                    EmployeeRole.role_id == role.id,
                )
            )
        ).scalar_one_or_none()
        if existing_er is None:
            er = EmployeeRole(
                employment_id=SYSTEM_EMP_ID,
                role_id=role.id,
                changed_by=SYSTEM_EMP_ID,
            )
            session.add(er)
            logger.info("Assigned Super Admin to employment %s", SYSTEM_EMP_ID)

        await session.commit()
        logger.info("Seed complete.")
        logger.info("Admin login: %s / %s", ADMIN_EMAIL, ADMIN_PASSWORD)
        logger.info("SYSTEM_EMPLOYMENT_ID=%s", SYSTEM_EMP_ID)


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception:
        logger.exception("Seed failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
