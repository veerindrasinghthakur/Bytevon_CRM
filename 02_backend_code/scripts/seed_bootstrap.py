"""
Bootstrap seed: system employment + super-admin + org masters + sample staff.

Run after migrations:
  cd 02_backend_code && python -m scripts.seed_bootstrap

Idempotent where possible.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import date, time
from decimal import Decimal

from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.db.enums import Action, EmploymentState, EmploymentType, ScopeName
from app.core.security.password_manager import PasswordManager
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.workforce.shift.models import Shift
from app.modules.admin.working_week.models import WorkingWeek
from app.modules.auth.models import Login, Person
from app.modules.rbac.models import (
    EmployeeRole,
    Permission,
    Resource,
    Role,
    Scope,
    SensitiveField,
)
from app.modules.workforce.department.models import Department
from app.modules.workforce.models import Employment, Position

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "ChangeMeAdmin!123"
SYSTEM_EMP_ID = settings.SYSTEM_EMPLOYMENT_ID

SAMPLE_STAFF = [
    {"first": "Asha", "last": "Patel", "email": "asha.patel@example.com", "code": "EMP-002"},
    {"first": "Rohan", "last": "Singh", "email": "rohan.singh@example.com", "code": "EMP-003"},
    {"first": "Meera", "last": "Iyer", "email": "meera.iyer@example.com", "code": "EMP-004"},
]
STAFF_PASSWORD = "Password123!"

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

# (resource_name, field_key) — consumed by app.core.serialization SEC-008 filtering.
SENSITIVE_FIELD_SEED = [
    ("salary", "gross_salary"),
    ("salary", "account_number"),
    ("salary", "ifsc_code"),
]


async def seed_rbac_catalog(session) -> None:
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

    resources_by_name = {res.name: res for res in resources}
    for resource_name, field_key in SENSITIVE_FIELD_SEED:
        res = resources_by_name.get(resource_name)
        if res is None:
            continue
        existing = (
            await session.execute(
                select(SensitiveField).where(SensitiveField.field_key == field_key)
            )
        ).scalar_one_or_none()
        if existing is None:
            session.add(SensitiveField(field_key=field_key, resource_id=res.id))
    await session.flush()
    logger.info("RBAC catalog seeded (%s resources)", len(resources))


async def seed_org_masters(session, system_emp_id: int) -> tuple:
    """Working week, general shift, HQ location. Returns (ww, shift, location)."""
    ww = (
        await session.execute(select(WorkingWeek).where(WorkingWeek.name == "Standard Mon–Fri"))
    ).scalar_one_or_none()
    if ww is None:
        ww = WorkingWeek(
            name="Standard Mon–Fri",
            working_days_of_week=[1, 2, 3, 4, 5],
            effective_from=date(2020, 1, 1),
            effective_to=None,
            created_by=system_emp_id,
        )
        session.add(ww)
        await session.flush()
        logger.info("Created working week id=%s", ww.id)

    shift = (
        await session.execute(select(Shift).where(Shift.name == "General Shift"))
    ).scalar_one_or_none()
    if shift is None:
        shift = Shift(
            name="General Shift",
            start_time=time(9, 30),
            end_time=time(18, 30),
            is_overnight=False,
            grace_late_minutes=15,
            flexible_end=False,
            break_duration_minutes=60,
            changed_by=system_emp_id,
        )
        session.add(shift)
        await session.flush()
        logger.info("Created shift id=%s", shift.id)

    loc = (
        await session.execute(select(Location).where(Location.name == "HQ — Mumbai"))
    ).scalar_one_or_none()
    if loc is None:
        loc = Location(
            name="HQ — Mumbai",
            timezone="Asia/Kolkata",
            working_week_id=ww.id,
            holiday_calendar_id=None,
            latitude=Decimal("19.0760900"),
            longitude=Decimal("72.8774260"),
            attendance_radius_meters=200,
            allowed_ip_cidrs=[],
            country="India",
            state="Maharashtra",
            city="Mumbai",
            address="ByteVon HQ, BKC, Mumbai",
            payroll_region="IN-MH",
            currency="INR",
            fiscal_year_start_month=4,
            changed_by=system_emp_id,
        )
        session.add(loc)
        await session.flush()
        logger.info("Created location id=%s", loc.id)

    return ww, shift, loc


async def seed_sample_staff(
    session, *,
    dept: Department,
    pos: Position,
    role: Role,
    pwd: PasswordManager,
    system_emp_id: int,
) -> None:
    for row in SAMPLE_STAFF:
        person = (
            await session.execute(
                select(Person).where(
                    Person.first_name == row["first"], Person.last_name == row["last"]
                )
            )
        ).scalar_one_or_none()
        if person is None:
            person = Person(first_name=row["first"], last_name=row["last"])
            session.add(person)
            await session.flush()

        login = (
            await session.execute(select(Login).where(Login.email == row["email"]))
        ).scalar_one_or_none()
        if login is None:
            login = Login(
                person_id=person.id,
                email=row["email"],
                password_hash=pwd.hash(STAFF_PASSWORD),
                is_active=True,
                failed_attempt_count=0,
            )
            session.add(login)
            await session.flush()
        else:
            login.password_hash = pwd.hash(STAFF_PASSWORD)
            login.is_active = True
            login.failed_attempt_count = 0
            login.locked_until = None

        emp = (
            await session.execute(
                select(Employment).where(Employment.employee_code == row["code"])
            )
        ).scalar_one_or_none()
        if emp is None:
            emp = Employment(
                person_id=person.id,
                employee_code=row["code"],
                employment_type=EmploymentType.FULL_TIME,
                current_state=EmploymentState.CONFIRMED,
                joining_date=date(2024, 1, 15),
                changed_by=system_emp_id,
            )
            session.add(emp)
            await session.flush()

        existing_er = (
            await session.execute(
                select(EmployeeRole).where(
                    EmployeeRole.employment_id == emp.id,
                    EmployeeRole.role_id == role.id,
                )
            )
        ).scalar_one_or_none()
        if existing_er is None:
            session.add(
                EmployeeRole(
                    employment_id=emp.id,
                    role_id=role.id,
                    changed_by=system_emp_id,
                )
            )
        logger.info("Sample staff %s (%s) employment_id=%s", row["email"], row["code"], emp.id)


async def seed() -> None:
    pwd = PasswordManager()
    async with AsyncSessionLocal() as session:
        await seed_rbac_catalog(session)

        existing_org = (
            await session.execute(select(OrganizationSettings).limit(1))
        ).scalar_one_or_none()
        if existing_org is None:
            session.add(
                OrganizationSettings(
                    company_name="ByteVon",
                    default_timezone="Asia/Kolkata",
                    default_currency="INR",
                )
            )
            logger.info("Created organization_settings")

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

        eng = (
            await session.execute(select(Department).where(Department.name == "Engineering"))
        ).scalar_one_or_none()
        if eng is None:
            eng = Department(name="Engineering")
            session.add(eng)
            await session.flush()
            logger.info("Created department Engineering id=%s", eng.id)

        sales_dept = (
            await session.execute(select(Department).where(Department.name == "Sales"))
        ).scalar_one_or_none()
        if sales_dept is None:
            sales_dept = Department(name="Sales")
            session.add(sales_dept)
            await session.flush()
            logger.info("Created department Sales id=%s", sales_dept.id)

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

        for pname in ("Software Engineer", "Sales Executive", "HR Executive"):
            p = (
                await session.execute(select(Position).where(Position.name == pname))
            ).scalar_one_or_none()
            if p is None:
                session.add(Position(name=pname))
        await session.flush()

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
            await session.execute(select(Login).where(Login.person_id == person.id))
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
            login.email = ADMIN_EMAIL
            login.password_hash = pwd.hash(ADMIN_PASSWORD)
            login.is_active = True
            login.failed_attempt_count = 0
            login.locked_until = None
            logger.info("Reset login id=%s for %s", login.id, ADMIN_EMAIL)

        emp = (
            await session.execute(
                select(Employment).where(Employment.id == SYSTEM_EMP_ID)
            )
        ).scalar_one_or_none()
        if emp is None:
            emp = Employment(
                id=SYSTEM_EMP_ID,
                person_id=person.id,
                employee_code="SYS-001",
                employment_type=EmploymentType.FULL_TIME,
                current_state=EmploymentState.CONFIRMED,
                joining_date=date.today(),
                changed_by=SYSTEM_EMP_ID,
            )
            session.add(emp)
            await session.flush()
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
            session.add(
                EmployeeRole(
                    employment_id=SYSTEM_EMP_ID,
                    role_id=role.id,
                    changed_by=SYSTEM_EMP_ID,
                )
            )
            logger.info("Assigned Super Admin to employment %s", SYSTEM_EMP_ID)

        await seed_org_masters(session, SYSTEM_EMP_ID)
        await seed_sample_staff(
            session,
            dept=dept,
            pos=pos,
            role=role,
            pwd=pwd,
            system_emp_id=SYSTEM_EMP_ID,
        )

        await session.commit()
        logger.info("Seed complete.")
        logger.info("Admin login: %s / %s", ADMIN_EMAIL, ADMIN_PASSWORD)
        logger.info("Sample staff password (all): %s", STAFF_PASSWORD)
        logger.info("SYSTEM_EMPLOYMENT_ID=%s", SYSTEM_EMP_ID)


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception:
        logger.exception("Seed failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
