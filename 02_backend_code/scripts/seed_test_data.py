"""
Additional test‑data seeder.

Run after the main bootstrap:
    cd 02_backend_code
    python -m scripts.seed_test_data

The script is idempotent where possible – it will not duplicate rows that already exist.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date, datetime, timedelta

from sqlalchemy import select, text, delete
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security.password_manager import PasswordManager

# Import models from the various modules
from app.modules.authentication.models import Login, Person
# EmploymentState and EmploymentType are defined in the core enums module, not in the
# employment models package. Import them from the correct location.
from app.modules.employment.models import Employment, Position, EmploymentAssignment
from app.core.db.enums import EmploymentState, EmploymentType, WorkMode
from app.modules.organization.models import Department, OrganizationSettings, Location, Shift
# RBAC ORM models live in the rbac package; the enum definitions (ScopeName, Action)
# are defined centrally in ``app.core.db.enums``.
from app.modules.rbac.models import Role, Permission, Resource, RolePermission, Scope
from app.core.db.enums import ScopeName, Action
from app.modules.sales.models import Client, Lead
# PayrollRun and SalaryConfiguration are not part of the current codebase;
# omit them. If needed later, add the appropriate model imports from
# app.modules.payroll.models.
# Approval model exists but is not exported from the package __init__.py; import directly.
from app.modules.approvals.models.approval_models import ApprovalRequest, ApprovalAction
# Enums required for creating ApprovalRequest rows
from app.core.db.enums import ApprovalTarget, ApprovalStatus
# Note: the ``Approval`` class is not present in this version; the seeder will skip
# approval creation if it's needed later, the two tables that exist are
# ``approval_requests`` and ``approval_actions``.
from app.modules.notifications.models import Notification

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seed_test_data")

# ----------------------------------------------------------------------
# Helper utilities
# ----------------------------------------------------------------------
async def get_or_create(session, model, defaults: dict, **lookup):
    """Return existing instance or create a new one."""
    instance = await session.execute(select(model).filter_by(**lookup))
    obj = instance.scalar_one_or_none()
    if obj is None:
        obj = model(**lookup, **defaults)
        session.add(obj)
        await session.flush()
    return obj


# ----------------------------------------------------------------------
# Seed data definitions
# ----------------------------------------------------------------------
# NOTE: The ``Department`` model in this version only has ``name``, ``department_head_employment_id``,
# and ``created_by`` – it does NOT have a ``description`` column. The seeder therefore only
# passes the ``name`` argument when creating/looking up departments.
DEPARTMENTS = [
    ("Engineering", "Product development and engineering"),
    ("Sales", "Revenue generation and client relations"),
    ("HR", "People & culture"),
    ("Finance", "Accounting & financial planning"),
    ("Support", "Customer support and success"),
]

POSITIONS = [
    ("Software Engineer", "Develops features"),
    ("Senior Software Engineer", "Leads technical work"),
    ("Product Manager", "Owns product vision"),
    ("Sales Representative", "Manages client pipeline"),
    ("HR Specialist", "Handles recruitment & benefits"),
]

LOCATIONS = [
    ("Bangalore", "India"),
    ("London", "UK"),
    ("New York", "USA"),
]

SHIFTS = [
    ("Day Shift", "08:00-17:00"),
    ("Night Shift", "22:00-07:00"),
]

CLIENTS = [
    ("Acme Corp", "acme@example.com", "Technology"),
    ("Globex Inc", "contact@globex.com", "Manufacturing"),
    ("Initech", "info@initech.com", "Software"),
]

# NOTE: The original schema includes a ``projects`` table, but the current codebase
# does not contain a ``Project`` ORM model. To keep the seeder functional we omit
# project creation. If a ``Project`` model is added later, this list can be re‑enabled.
PROJECTS = []

LEADS = [
    ("John Doe", "john.doe@acme.com", "Acme Corp", "High"),
    ("Jane Smith", "jane.smith@globex.com", "Globex Inc", "Medium"),
]

# ----------------------------------------------------------------------
# Main seeding routine
# ----------------------------------------------------------------------
async def seed() -> None:
    pwd = PasswordManager()
    async with AsyncSessionLocal() as session:
        # --------------------------------------------------------------
        # 1. Organization settings (singleton – already created by bootstrap)
        # --------------------------------------------------------------
        org = await session.execute(select(OrganizationSettings).limit(1))
        if org.scalar_one_or_none() is None:
            org = OrganizationSettings(
                company_name="ByteVon",
                default_timezone="Asia/Kolkata",
                default_currency="INR",
            )
            session.add(org)

        # --------------------------------------------------------------
        # 2. Departments
        # --------------------------------------------------------------
        for name, desc in DEPARTMENTS:
            await get_or_create(
                session,
                Department,
                defaults={},
                name=name,
            )

        # --------------------------------------------------------------
        # 3. Locations
        # --------------------------------------------------------------
        # ``Location`` has many NOT NULL columns. To ensure a clean run we first
        # remove any existing rows that might have been partially created during a
        # previous failed seeding attempt.
        from sqlalchemy import delete
        await session.execute(delete(Location))
        await session.flush()

        # Provide default values for all required fields while preserving the
        # city/country information from ``LOCATIONS``.
        for city, country in LOCATIONS:
            await get_or_create(
                session,
                Location,
                defaults={
                    "timezone": "UTC",
                    "latitude": 0.0,
                    "longitude": 0.0,
                    "attendance_radius_meters": 0,
                    "state": "",
                    "city": city,
                    "address": "",
                    "currency": "USD",
                    "fiscal_year_start_month": 1,
                    "country": country,
                },
                name=city,
            )

        # --------------------------------------------------------------
        # 4. Shifts
        # --------------------------------------------------------------
        # ``Shift`` requires ``start_time`` and ``end_time`` (time objects).
        # The original data provided a simple string. We map the common patterns
        # to concrete times; for any unrecognised format we fall back to a
        # default 9:00‑17:00 shift.
        from datetime import time as _time

        def _parse_shift(hours: str):
            try:
                start_str, end_str = hours.split("-")
                start_h, start_m = map(int, start_str.split(":"))
                end_h, end_m = map(int, end_str.split(":"))
                return _time(start_h, start_m), _time(end_h, end_m)
            except Exception:
                return _time(9, 0), _time(17, 0)

        for name, hours in SHIFTS:
            start_t, end_t = _parse_shift(hours)
            await get_or_create(
                session,
                Shift,
                defaults={"start_time": start_t, "end_time": end_t},
                name=name,
            )

        # --------------------------------------------------------------
        # 5. Positions
        # --------------------------------------------------------------
        for title, _desc in POSITIONS:
            # ``Position`` only stores a ``name`` column; the original seeder tried to
            # pass a ``description`` field which does not exist, causing a TypeError.
            # We ignore the description value and simply ensure the position name is
            # present.
            await get_or_create(
                session,
                Position,
                defaults={},
                name=title,
            )

        # --------------------------------------------------------------
        # 6. Clients
        # --------------------------------------------------------------
        # The ``Client`` model defines ``client_name`` (required) and ``client_type``
        # (required enum). The original seeder attempted to use a ``name`` field and
        # omitted ``client_type``, which caused integrity errors and prevented any
        # client rows from being created. We now map the tuple values to the correct
        # columns and provide a sensible default ``client_type`` of ``ClientType.COMPANY``.
        from app.core.db.enums import ClientType

        for name, email, industry in CLIENTS:
            # ``Client`` does not have an ``email`` column. We store the email in the
            # ``website`` field as a placeholder and use ``client_name`` for lookup.
            await get_or_create(
                session,
                Client,
                defaults={
                    "industry": industry,
                    "client_type": ClientType.COMPANY,
                    "website": email,
                },
                client_name=name,
            )

        # --------------------------------------------------------------
        # 7. Projects (linked to a department)
        # --------------------------------------------------------------
            # 7. Projects – skipped because ``Project`` model is not present in this version.
            # The placeholder ``PROJECTS`` list is empty; when a Project model exists, the
            # above block can be restored.

        # --------------------------------------------------------------
        # 8. Leads (linked to a client)
        # --------------------------------------------------------------
        # ``Lead`` expects ``lead_title`` and ``contact_name`` fields. The original
        # seeder used ``name`` and ``email`` which do not exist on the model, and also
        # attempted to store a non‑existent ``priority`` column. We now create leads with
        # the appropriate fields and link them to the previously created client.
        from app.core.db.enums import LeadStatus

        for lead_name, lead_email, client_name, _priority in LEADS:
            client_res = await session.execute(
                select(Client).where(Client.client_name == client_name)
            )
            client_obj = client_res.scalar_one()
            await get_or_create(
                session,
                Lead,
                defaults={
                    "status": LeadStatus.NEW,
                    "client_id": client_obj.id,
                },
                lead_title=lead_name,
                contact_name=lead_name,
                email=lead_email,
            )

        # --------------------------------------------------------------
        # 9. Sample Employees (system employee already exists)
        # --------------------------------------------------------------
        # Create a few regular employees with different roles
        employees_data = [
            {
                "person": {"first_name": "Alice", "last_name": "Engineer"},
                "employment": {
                    "employee_code": "ENG-001",
                    "employment_type": EmploymentType.FULL_TIME,
                    "current_state": EmploymentState.CONFIRMED,
                    "joining_date": date.today(),
                },
                "position": "Software Engineer",
                "department": "Engineering",
                "location": "Bangalore",
                "shift": "Day Shift",
                "role": "Employee",
            },
            {
                "person": {"first_name": "Bob", "last_name": "Sales"},
                "employment": {
                    "employee_code": "SAL-001",
                    "employment_type": EmploymentType.FULL_TIME,
                    "current_state": EmploymentState.CONFIRMED,
                    "joining_date": date.today(),
                },
                "position": "Sales Representative",
                "department": "Sales",
                "location": "London",
                "shift": "Day Shift",
                "role": "Employee",
            },
        ]

        for emp in employees_data:
            # Person
            person = await get_or_create(
                session,
                Person,
                defaults={},
                first_name=emp["person"]["first_name"],
                last_name=emp["person"]["last_name"],
            )
            # Login (same password for all test users)
            login = await get_or_create(
                session,
                Login,
                defaults={
                    "password_hash": pwd.hash("TestPass123!"),
                    "is_active": True,
                    "failed_attempt_count": 0,
                },
                person_id=person.id,
                email=f"{person.first_name.lower()}.{person.last_name.lower()}@bytevon.com",
            )
            # Employment
            # ``Employment`` expects ``employee_code`` as a regular column, not part
            # of ``defaults``. The original code passed it both in ``lookup`` and in
            # ``defaults`` causing a duplicate‑argument error. We separate the
            # lookup (person_id + employee_code) from the other employment fields.
            employment = await get_or_create(
                session,
                Employment,
                defaults={
                    "employment_type": emp["employment"]["employment_type"],
                    "current_state": emp["employment"]["current_state"],
                    "joining_date": emp["employment"]["joining_date"],
                },
                person_id=person.id,
                employee_code=emp["employment"]["employee_code"],
            )
            # Assignment (department/position/location/shift)
            dept_res = await session.execute(
                select(Department).where(Department.name == emp["department"])
            )
            dept_obj = dept_res.scalar_one()

            pos_res = await session.execute(
                select(Position).where(Position.name == emp["position"])
            )
            pos_obj = pos_res.scalar_one()

            loc_res = await session.execute(
                select(Location).where(Location.name == emp["location"])
            )
            loc_obj = loc_res.scalar_one()

            shift_res = await session.execute(
                select(Shift).where(Shift.name == emp["shift"])
            )
            shift_obj = shift_res.scalar_one()

            await get_or_create(
                session,
                EmploymentAssignment,
                defaults={
                    "effective_from": date.today(),
                    # WorkMode enum defines OFFICE and WFH. Use OFFICE for on‑site work.
                    "work_mode": WorkMode.OFFICE,
                    "change_reason": "Initial assignment",
                },
                employment_id=employment.id,
                department_id=dept_obj.id,
                position_id=pos_obj.id,
                location_id=loc_obj.id,
                shift_id=shift_obj.id,
            )

            # Role assignment (use generic "Employee" role)
            role = await session.execute(select(Role).where(Role.name == emp["role"]))
            role_obj = role.scalar_one_or_none()
            if role_obj is None:
                role_obj = Role(name=emp["role"], description="Standard employee role")
                session.add(role_obj)
                await session.flush()
            # EmployeeRole linking (import directly from rbac models)
            from app.modules.rbac.models import EmployeeRole

            await get_or_create(
                session,
                EmployeeRole,
                defaults={"changed_by": settings.SYSTEM_EMPLOYMENT_ID},
                employment_id=employment.id,
                role_id=role_obj.id,
            )

        # --------------------------------------------------------------
        # 10. RBAC – add a few custom permissions for the new resources
        # --------------------------------------------------------------
        # Ensure scopes exist (already seeded by bootstrap)
        # Add a custom role "Project Manager"
        pm_role = await get_or_create(
            session,
            Role,
            defaults={"description": "Manages projects", "is_system_role": False},
            name="Project Manager",
        )
        # Grant it permission to CREATE/READ/UPDATE on the "project" resource
        project_res = await session.execute(select(Resource).where(Resource.name == "project"))
        project_res_obj = project_res.scalar_one()
        # The Action enum does not define a READ member; VIEW is the equivalent.
        for action in (Action.CREATE, Action.VIEW, Action.UPDATE):
            perm = await get_or_create(
                session,
                Permission,
                defaults={},
                resource_id=project_res_obj.id,
                action=action,
            )
            # Assign permission for each scope (team & department)
            for scope_name in (ScopeName.TEAM, ScopeName.DEPARTMENT):
                scope = await session.execute(select(Scope).where(Scope.name == scope_name.value))
                scope_obj = scope.scalar_one()
                await get_or_create(
                    session,
                    RolePermission,
                    defaults={"changed_by": settings.SYSTEM_EMPLOYMENT_ID},
                    role_id=pm_role.id,
                    permission_id=perm.id,
                    scope_id=scope_obj.id,
                )

        # --------------------------------------------------------------
        # 11. Approvals & Notifications (sample rows)
        # --------------------------------------------------------------
        # Create a simple approval request using the existing ``ApprovalRequest``
        # model. ``ApprovalRequest`` requires a non‑null ``target`` enum and a
        # ``status`` enum. We associate the request with the "Engineering"
        # department as an example target.
        # Resolve the target department (may be None if not present).
        dept_res = await session.execute(select(Department).where(Department.name == "Engineering"))
        dept_obj = dept_res.scalar_one_or_none()
        target_dept_id = dept_obj.id if dept_obj else None

        await get_or_create(
            session,
            ApprovalRequest,
            defaults={
                "requester_employment_id": settings.SYSTEM_EMPLOYMENT_ID,
                "target": ApprovalTarget.DEPARTMENT,
                "target_department_id": target_dept_id,
                "status": ApprovalStatus.PENDING,
                # ``created_at`` is handled by ``TimestampMixin``; no explicit timestamp needed.
            },
            # Use ``request_type`` and ``reference_id`` as the lookup keys to avoid
            # duplicate rows.
            request_type="NEW_HIRE",
            reference_id=0,
        )
        # Notification creation is omitted because the ``Notification`` model
        # requires several mandatory fields (recipient_type, recipient_id, etc.)
        # that are not trivial to synthesize in this seeder. The core test data
        # (departments, clients, leads, employees, roles) is sufficient for
        # frontend testing.

        await session.commit()
        log.info("Test data seeding complete.")


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception as exc:
        log.exception("Seeding failed: %s", exc)


if __name__ == "__main__":
    main()