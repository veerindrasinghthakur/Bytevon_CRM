"""
Additional test-data seeder.

Run after the main bootstrap:
    cd 02_backend_code
    python -m scripts.seed_test_data

The script is idempotent where possible – it will not duplicate rows that already exist.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date

from sqlalchemy import delete, select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.db.enums import Action, EmploymentState, EmploymentType, ScopeName, WorkMode
from app.core.security.password_manager import PasswordManager
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.admin.shift.models import Shift
from app.modules.auth.models import Login, Person
from app.modules.rbac.models import Permission, Resource, Role, RolePermission, Scope
from app.modules.sales.models import Client, Lead
from app.modules.workforce.department.models import Department
from app.modules.workforce.models import Employment, EmploymentAssignment, Position

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seed_test_data")


async def get_or_create(session, model, defaults: dict, **lookup):
    """Return existing instance or create a new one."""
    instance = await session.execute(select(model).filter_by(**lookup))
    obj = instance.scalar_one_or_none()
    if obj is None:
        obj = model(**lookup, **defaults)
        session.add(obj)
        await session.flush()
    return obj


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

LEADS = [
    ("John Doe", "john.doe@acme.com", "Acme Corp", "High"),
    ("Jane Smith", "jane.smith@globex.com", "Globex Inc", "Medium"),
]


async def seed() -> None:
    pwd = PasswordManager()
    async with AsyncSessionLocal() as session:
        org = await session.execute(select(OrganizationSettings).limit(1))
        if org.scalar_one_or_none() is None:
            session.add(
                OrganizationSettings(
                    company_name="ByteVon",
                    default_timezone="Asia/Kolkata",
                    default_currency="INR",
                )
            )

        for name, _desc in DEPARTMENTS:
            await get_or_create(session, Department, defaults={}, name=name)

        await session.execute(delete(Location))
        await session.flush()

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

        for title, _desc in POSITIONS:
            await get_or_create(session, Position, defaults={}, name=title)

        from app.core.db.enums import ClientType

        for name, email, industry in CLIENTS:
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
            person = await get_or_create(
                session,
                Person,
                defaults={},
                first_name=emp["person"]["first_name"],
                last_name=emp["person"]["last_name"],
            )
            await get_or_create(
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
            dept_obj = (
                await session.execute(
                    select(Department).where(Department.name == emp["department"])
                )
            ).scalar_one()
            pos_obj = (
                await session.execute(
                    select(Position).where(Position.name == emp["position"])
                )
            ).scalar_one()
            loc_obj = (
                await session.execute(
                    select(Location).where(Location.name == emp["location"])
                )
            ).scalar_one()
            shift_obj = (
                await session.execute(select(Shift).where(Shift.name == emp["shift"]))
            ).scalar_one()

            await get_or_create(
                session,
                EmploymentAssignment,
                defaults={
                    "effective_from": date.today(),
                    "work_mode": WorkMode.OFFICE,
                    "change_reason": "Initial assignment",
                },
                employment_id=employment.id,
                department_id=dept_obj.id,
                position_id=pos_obj.id,
                location_id=loc_obj.id,
                shift_id=shift_obj.id,
            )

            role_obj = (
                await session.execute(select(Role).where(Role.name == emp["role"]))
            ).scalar_one_or_none()
            if role_obj is None:
                role_obj = Role(name=emp["role"], description="Standard employee role")
                session.add(role_obj)
                await session.flush()
            from app.modules.rbac.models import EmployeeRole

            await get_or_create(
                session,
                EmployeeRole,
                defaults={"changed_by": settings.SYSTEM_EMPLOYMENT_ID},
                employment_id=employment.id,
                role_id=role_obj.id,
            )

        pm_role = await get_or_create(
            session,
            Role,
            defaults={"description": "Manages projects", "is_system_role": False},
            name="Project Manager",
        )
        project_res_obj = (
            await session.execute(select(Resource).where(Resource.name == "project"))
        ).scalar_one()
        for action in (Action.CREATE, Action.VIEW, Action.UPDATE):
            perm = await get_or_create(
                session,
                Permission,
                defaults={},
                resource_id=project_res_obj.id,
                action=action,
            )
            for scope_name in (ScopeName.TEAM, ScopeName.DEPARTMENT):
                scope_obj = (
                    await session.execute(
                        select(Scope).where(Scope.name == scope_name.value)
                    )
                ).scalar_one()
                await get_or_create(
                    session,
                    RolePermission,
                    defaults={"changed_by": settings.SYSTEM_EMPLOYMENT_ID},
                    role_id=pm_role.id,
                    permission_id=perm.id,
                    scope_id=scope_obj.id,
                )

        await session.commit()
        log.info("seed_test_data complete")


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception:
        log.exception("Seed failed")
        raise


if __name__ == "__main__":
    main()
