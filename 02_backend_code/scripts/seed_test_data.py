"""
Comprehensive demo-data seeder.

Run after bootstrap seed:
    cd 02_backend_code
    python -m scripts.seed_test_data

The script is idempotent — it uses get_or_create for all rows and will not
duplicate records that already exist.  It does NOT delete existing data.

Gaps intentionally left unseeded (see KNOWN_GAPS at bottom of file):
- Payroll runs / monthly payroll items (require salary components first)
- Approval request / approval action rows (require a running service)
- Attendance punches / corrections (require date-specific business logic)
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import date, time
from decimal import Decimal

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.db.enums import (
    Action,
    ClientType,
    EmploymentState,
    EmploymentType,
    HolidayType,
    LeadStatus,
    ProjectAssignmentType,
    ProjectPhase,
    ProjectSource,
    ProjectStatus,
    ScopeName,
    TaskPriority,
    TaskStatus,
    WorkMode,
)
from app.core.security.password_manager import PasswordManager
from app.modules.admin.holiday_calendar.models import Holiday, HolidayCalendar
from app.modules.admin.location.models import Location
from app.modules.admin.settings.models import OrganizationSettings
from app.modules.admin.working_week.models import WorkingWeek
from app.modules.auth.models import Login, Person
from app.modules.leave.models import LeavePolicy, LeaveType, LeaveLedger
from app.modules.project.project.models import Project
from app.modules.project.task.models import Task, TaskTimeEntry
from app.modules.project.team.models import Team, TeamMember
from app.modules.rbac.models import (
    EmployeeRole,
    Permission,
    Resource,
    Role,
    RolePermission,
    Scope,
)
from app.modules.sales.models import Client, ClientContact, Lead, Platform
from app.modules.workforce.department.models import Department
from app.modules.workforce.models import (
    Employment,
    EmploymentAssignment,
    EmploymentStateHistory,
    Position,
)
from app.modules.workforce.shift.models import Shift

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seed_test_data")

SYSTEM_EMP_ID = settings.SYSTEM_EMPLOYMENT_ID
DEMO_PASSWORD = "Password123!"


# ---------------------------------------------------------------------------
# Generic helper
# ---------------------------------------------------------------------------

async def get_or_create(session, model, defaults: dict, **lookup):
    """Return existing instance or create + flush a new one."""
    result = await session.execute(select(model).filter_by(**lookup))
    obj = result.scalar_one_or_none()
    if obj is None:
        obj = model(**lookup, **defaults)
        session.add(obj)
        await session.flush()
    return obj


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

DEPARTMENTS = [
    ("Engineering", "Product development and engineering"),
    ("Sales", "Revenue generation and client relations"),
    ("HR", "People & culture"),
    ("Finance", "Accounting & financial planning"),
    ("Support", "Customer support and success"),
]

POSITIONS = [
    ("Software Engineer", None),
    ("Senior Software Engineer", None),
    ("Product Manager", None),
    ("Sales Representative", None),
    ("HR Specialist", None),
    ("Financial Analyst", None),
    ("Support Specialist", None),
    ("Tech Lead", None),
]

# (name, timezone, country, state, city, latitude, longitude)
LOCATIONS_EXTRA = [
    ("Bangalore Office", "Asia/Kolkata", "India", "Karnataka", "Bangalore", "12.9716000", "77.5946000"),
    ("London Office", "Europe/London", "UK", "England", "London", "51.5074000", "-0.1278000"),
    ("New York Office", "America/New_York", "USA", "New York", "New York", "40.7128000", "-74.0060000"),
]

# (name, start, end, is_overnight)
SHIFTS_EXTRA = [
    ("Day Shift", time(8, 0), time(17, 0), False),
    ("Night Shift", time(22, 0), time(7, 0), True),
    ("Flexible Shift", time(10, 0), time(19, 0), False),
]

# Leave types: (code, name, is_paid, annual_entitlement, requires_approval)
LEAVE_TYPES = [
    ("CL", "Casual Leave", True, Decimal("12"), True),
    ("SL", "Sick Leave", True, Decimal("10"), False),
    ("EL", "Earned Leave", True, Decimal("18"), True),
    ("LOP", "Loss of Pay", False, Decimal("0"), True),
    ("CO", "Comp Off", True, Decimal("0"), True),
]

# (client_name, industry, country, client_type)
CLIENTS = [
    ("Acme Corporation", "Technology", "USA", ClientType.COMPANY),
    ("Globex Industries", "Manufacturing", "USA", ClientType.COMPANY),
    ("Initech Solutions", "Software", "UK", ClientType.COMPANY),
    ("Umbrella Consulting", "Consulting", "India", ClientType.COMPANY),
    ("Stark Ventures", "Venture Capital", "USA", ClientType.COMPANY),
]

# (platform_name, description)
PLATFORMS = [
    ("LinkedIn", "Professional networking platform"),
    ("Website Inquiry", "Inbound from company website"),
    ("Referral", "Client or employee referral"),
    ("Email Campaign", "Outbound email marketing"),
]

# Demo employees (beyond bootstrap sample staff)
DEMO_EMPLOYEES = [
    {
        "first": "Alice", "last": "Chen",
        "email": "alice.chen@bytevon.com",
        "code": "ENG-001",
        "dept": "Engineering", "pos": "Software Engineer",
        "location": "Bangalore Office", "shift": "Day Shift",
        "role": "Employee",
        "joining": date(2023, 3, 1),
    },
    {
        "first": "Bob", "last": "Martinez",
        "email": "bob.martinez@bytevon.com",
        "code": "ENG-002",
        "dept": "Engineering", "pos": "Senior Software Engineer",
        "location": "Bangalore Office", "shift": "Day Shift",
        "role": "Employee",
        "joining": date(2022, 6, 15),
    },
    {
        "first": "Carol", "last": "Williams",
        "email": "carol.williams@bytevon.com",
        "code": "SAL-001",
        "dept": "Sales", "pos": "Sales Representative",
        "location": "London Office", "shift": "Day Shift",
        "role": "Employee",
        "joining": date(2023, 1, 10),
    },
    {
        "first": "David", "last": "Kim",
        "email": "david.kim@bytevon.com",
        "code": "SAL-002",
        "dept": "Sales", "pos": "Sales Representative",
        "location": "New York Office", "shift": "Flexible Shift",
        "role": "Employee",
        "joining": date(2023, 7, 20),
    },
    {
        "first": "Eva", "last": "Sharma",
        "email": "eva.sharma@bytevon.com",
        "code": "HR-001",
        "dept": "HR", "pos": "HR Specialist",
        "location": "Bangalore Office", "shift": "Day Shift",
        "role": "HR Manager",
        "joining": date(2022, 11, 1),
    },
    {
        "first": "Frank", "last": "Okafor",
        "email": "frank.okafor@bytevon.com",
        "code": "ENG-003",
        "dept": "Engineering", "pos": "Tech Lead",
        "location": "London Office", "shift": "Day Shift",
        "role": "Project Manager",
        "joining": date(2021, 8, 5),
    },
    {
        "first": "Grace", "last": "Thompson",
        "email": "grace.thompson@bytevon.com",
        "code": "FIN-001",
        "dept": "Finance", "pos": "Financial Analyst",
        "location": "New York Office", "shift": "Day Shift",
        "role": "Employee",
        "joining": date(2023, 4, 12),
    },
    {
        "first": "Henry", "last": "Liu",
        "email": "henry.liu@bytevon.com",
        "code": "SUP-001",
        "dept": "Support", "pos": "Support Specialist",
        "location": "Bangalore Office", "shift": "Night Shift",
        "role": "Employee",
        "joining": date(2024, 1, 8),
    },
]


# ---------------------------------------------------------------------------
# Seeder functions
# ---------------------------------------------------------------------------

async def seed_departments(session) -> dict[str, Department]:
    depts = {}
    for name, _desc in DEPARTMENTS:
        d = await get_or_create(session, Department, defaults={}, name=name)
        depts[name] = d
    log.info("Departments seeded: %s", list(depts.keys()))
    return depts


async def seed_positions(session) -> dict[str, Position]:
    positions = {}
    for name, _desc in POSITIONS:
        p = await get_or_create(session, Position, defaults={}, name=name)
        positions[name] = p
    log.info("Positions seeded: %s", list(positions.keys()))
    return positions


async def seed_locations(session, ww_id: int) -> dict[str, Location]:
    locs = {}
    for name, tz, country, state, city, lat, lng in LOCATIONS_EXTRA:
        loc = await get_or_create(
            session,
            Location,
            defaults={
                "timezone": tz,
                "working_week_id": ww_id,
                "holiday_calendar_id": None,
                "latitude": Decimal(lat),
                "longitude": Decimal(lng),
                "attendance_radius_meters": 500,
                "allowed_ip_cidrs": [],
                "country": country,
                "state": state,
                "city": city,
                "address": f"ByteVon {name}",
                "currency": "USD" if country != "India" else "INR",
                "fiscal_year_start_month": 4 if country == "India" else 1,
                "changed_by": SYSTEM_EMP_ID,
            },
            name=name,
        )
        locs[name] = loc
    log.info("Locations seeded: %s", list(locs.keys()))
    return locs


async def seed_shifts(session) -> dict[str, Shift]:
    shifts = {}
    for name, start, end, overnight in SHIFTS_EXTRA:
        s = await get_or_create(
            session,
            Shift,
            defaults={
                "start_time": start,
                "end_time": end,
                "is_overnight": overnight,
                "grace_late_minutes": 15,
                "flexible_end": name == "Flexible Shift",
                "break_duration_minutes": 60,
                "changed_by": SYSTEM_EMP_ID,
            },
            name=name,
        )
        shifts[name] = s
    log.info("Shifts seeded: %s", list(shifts.keys()))
    return shifts


async def seed_holiday_calendar(session) -> HolidayCalendar:
    cal = await get_or_create(
        session,
        HolidayCalendar,
        defaults={"changed_by": SYSTEM_EMP_ID},
        name="India 2025",
    )
    holidays = [
        ("Republic Day", date(2025, 1, 26), HolidayType.NATIONAL),
        ("Holi", date(2025, 3, 14), HolidayType.REGIONAL),
        ("Independence Day", date(2025, 8, 15), HolidayType.NATIONAL),
        ("Gandhi Jayanti", date(2025, 10, 2), HolidayType.NATIONAL),
        ("Diwali", date(2025, 10, 20), HolidayType.REGIONAL),
        ("Christmas", date(2025, 12, 25), HolidayType.NATIONAL),
    ]
    for hname, hdate, htype in holidays:
        await get_or_create(
            session,
            Holiday,
            defaults={
                "name": hname,
                "date": hdate,
                "holiday_type": htype,
                "recurring_flag": True,
                "changed_by": SYSTEM_EMP_ID,
            },
            holiday_calendar_id=cal.id,
            name=hname,
        )
    log.info("Holiday calendar '%s' seeded with %d holidays", cal.name, len(holidays))
    return cal


async def seed_leave_types(session) -> dict[str, LeaveType]:
    lt_map = {}
    for i, (code, name, is_paid, days, req_approval) in enumerate(LEAVE_TYPES):
        lt = await get_or_create(
            session,
            LeaveType,
            defaults={
                "name": name,
                "is_paid": is_paid,
                "requires_approval": req_approval,
                "requires_document": code == "SL",
                "allow_half_day": True,
                "allow_hourly": False,
                "is_encashable": code == "EL",
                "default_annual_entitlement": days,
                "is_active": True,
                "sort_order": i + 1,
            },
            code=code,
        )
        lt_map[code] = lt

        # Seed a policy for this leave type (effective from 2024-01-01)
        await get_or_create(
            session,
            LeavePolicy,
            defaults={
                "name": f"{name} Policy 2024",
                "annual_entitlement": days,
                "carry_forward_limit": Decimal("5") if code == "EL" else None,
                "effective_to": None,
                "changed_by": SYSTEM_EMP_ID,
            },
            leave_type_id=lt.id,
            name=f"{name} Policy 2024",
            effective_from=date(2024, 1, 1),
        )
    log.info("Leave types seeded: %s", list(lt_map.keys()))
    return lt_map


async def seed_roles(session) -> dict[str, Role]:
    role_defs = [
        ("Employee", "Standard employee — read own records", False),
        ("HR Manager", "Manages HR records across department", False),
        ("Project Manager", "Creates and manages projects and tasks", False),
        ("Sales Executive", "Manages leads and client accounts", False),
        ("Finance Manager", "Manages payroll and salary data", False),
    ]
    roles = {}
    for name, desc, is_system in role_defs:
        r = await get_or_create(
            session,
            Role,
            defaults={
                "description": desc,
                "is_system_role": is_system,
                "changed_by": SYSTEM_EMP_ID,
            },
            name=name,
        )
        roles[name] = r

    # Grant Employee role: VIEW on own employment/leave/attendance (SELF scope)
    emp_role = roles["Employee"]
    for res_name in ("employment", "leave_request", "attendance"):
        res = (await session.execute(select(Resource).where(Resource.name == res_name))).scalar_one_or_none()
        if res is None:
            continue
        scope_self = (await session.execute(select(Scope).where(Scope.name == ScopeName.SELF.value))).scalar_one_or_none()
        if scope_self is None:
            continue
        for action in (Action.VIEW,):
            perm = (await session.execute(
                select(Permission).where(Permission.resource_id == res.id, Permission.action == action)
            )).scalar_one_or_none()
            if perm is None:
                continue
            await get_or_create(
                session,
                RolePermission,
                defaults={"changed_by": SYSTEM_EMP_ID},
                role_id=emp_role.id,
                permission_id=perm.id,
                scope_id=scope_self.id,
            )

    # Grant HR Manager role: full CRUD on employment/leave across DEPARTMENT
    hr_role = roles["HR Manager"]
    for res_name in ("employment", "leave_request", "leave_policy", "attendance"):
        res = (await session.execute(select(Resource).where(Resource.name == res_name))).scalar_one_or_none()
        if res is None:
            continue
        scope_dept = (await session.execute(select(Scope).where(Scope.name == ScopeName.DEPARTMENT.value))).scalar_one_or_none()
        if scope_dept is None:
            continue
        for action in (Action.VIEW, Action.CREATE, Action.UPDATE, Action.APPROVE):
            perm = (await session.execute(
                select(Permission).where(Permission.resource_id == res.id, Permission.action == action)
            )).scalar_one_or_none()
            if perm is None:
                continue
            await get_or_create(
                session,
                RolePermission,
                defaults={"changed_by": SYSTEM_EMP_ID},
                role_id=hr_role.id,
                permission_id=perm.id,
                scope_id=scope_dept.id,
            )

    # Grant Project Manager role: CRUD on projects/tasks (ORGANIZATION scope)
    pm_role = roles["Project Manager"]
    for res_name in ("project", "task"):
        res = (await session.execute(select(Resource).where(Resource.name == res_name))).scalar_one_or_none()
        if res is None:
            continue
        scope_org = (await session.execute(select(Scope).where(Scope.name == ScopeName.ORGANIZATION.value))).scalar_one_or_none()
        if scope_org is None:
            continue
        for action in (Action.VIEW, Action.CREATE, Action.UPDATE, Action.DELETE):
            perm = (await session.execute(
                select(Permission).where(Permission.resource_id == res.id, Permission.action == action)
            )).scalar_one_or_none()
            if perm is None:
                continue
            await get_or_create(
                session,
                RolePermission,
                defaults={"changed_by": SYSTEM_EMP_ID},
                role_id=pm_role.id,
                permission_id=perm.id,
                scope_id=scope_org.id,
            )

    # Grant Sales Executive role: CRUD on leads/clients
    sales_role = roles["Sales Executive"]
    for res_name in ("lead", "client"):
        res = (await session.execute(select(Resource).where(Resource.name == res_name))).scalar_one_or_none()
        if res is None:
            continue
        scope_org = (await session.execute(select(Scope).where(Scope.name == ScopeName.ORGANIZATION.value))).scalar_one_or_none()
        if scope_org is None:
            continue
        for action in (Action.VIEW, Action.CREATE, Action.UPDATE):
            perm = (await session.execute(
                select(Permission).where(Permission.resource_id == res.id, Permission.action == action)
            )).scalar_one_or_none()
            if perm is None:
                continue
            await get_or_create(
                session,
                RolePermission,
                defaults={"changed_by": SYSTEM_EMP_ID},
                role_id=sales_role.id,
                permission_id=perm.id,
                scope_id=scope_org.id,
            )

    log.info("Roles seeded: %s", list(roles.keys()))
    return roles


async def seed_employees(
    session,
    depts: dict[str, Department],
    positions: dict[str, Position],
    locs: dict[str, Location],
    shifts: dict[str, Shift],
    roles: dict[str, Role],
    leave_types: dict[str, LeaveType],
) -> dict[str, Employment]:
    pwd = PasswordManager()
    employments = {}

    for emp_data in DEMO_EMPLOYEES:
        # Person
        person = await get_or_create(
            session,
            Person,
            defaults={},
            first_name=emp_data["first"],
            last_name=emp_data["last"],
        )
        # Login
        await get_or_create(
            session,
            Login,
            defaults={
                "password_hash": pwd.hash(DEMO_PASSWORD),
                "is_active": True,
                "failed_attempt_count": 0,
            },
            person_id=person.id,
            email=emp_data["email"],
        )
        # Employment
        employment = await get_or_create(
            session,
            Employment,
            defaults={
                "employment_type": EmploymentType.FULL_TIME,
                "current_state": EmploymentState.CONFIRMED,
                "joining_date": emp_data["joining"],
                "changed_by": SYSTEM_EMP_ID,
            },
            person_id=person.id,
            employee_code=emp_data["code"],
        )
        employments[emp_data["code"]] = employment

        # Assignment (current)
        dept = depts.get(emp_data["dept"])
        pos = positions.get(emp_data["pos"])
        loc = locs.get(emp_data["location"])
        shift = shifts.get(emp_data["shift"])

        if dept and pos and loc and shift:
            await get_or_create(
                session,
                EmploymentAssignment,
                defaults={
                    "effective_to": None,
                    "work_mode": WorkMode.OFFICE,
                    "change_reason": "Initial assignment",
                    "changed_by": SYSTEM_EMP_ID,
                },
                employment_id=employment.id,
                department_id=dept.id,
                position_id=pos.id,
                location_id=loc.id,
                shift_id=shift.id,
                effective_from=emp_data["joining"],
            )

        # State history (confirmed)
        await get_or_create(
            session,
            EmploymentStateHistory,
            defaults={
                "previous_state": None,
                "reason": "Initial hire",
                "changed_by": SYSTEM_EMP_ID,
            },
            employment_id=employment.id,
            new_state=EmploymentState.CONFIRMED,
            effective_date=emp_data["joining"],
        )

        # Role assignment
        role = roles.get(emp_data["role"])
        if role is None:
            role = roles.get("Employee")
        if role:
            await get_or_create(
                session,
                EmployeeRole,
                defaults={"changed_by": SYSTEM_EMP_ID},
                employment_id=employment.id,
                role_id=role.id,
            )

        # Seed leave ledger entitlements (CL and SL only to keep it simple)
        from app.core.db.enums import LeaveLedgerTransactionType
        from app.modules.leave.models import LeaveLedger
        for lt_code in ("CL", "SL", "EL"):
            lt = leave_types.get(lt_code)
            if lt is None:
                continue
            existing_ledger = (await session.execute(
                select(LeaveLedger).where(
                    LeaveLedger.employment_id == employment.id,
                    LeaveLedger.leave_type_id == lt.id,
                    LeaveLedger.transaction_type == LeaveLedgerTransactionType.ENTITLEMENT.value,
                )
            )).scalar_one_or_none()
            if existing_ledger is None:
                session.add(LeaveLedger(
                    employment_id=employment.id,
                    leave_type_id=lt.id,
                    transaction_type=LeaveLedgerTransactionType.ENTITLEMENT.value,
                    days=lt.default_annual_entitlement,
                    reference_type="POLICY",
                    reference_id=None,
                    changed_by=SYSTEM_EMP_ID,
                ))
        await session.flush()

        log.info(
            "Employee %s %s (%s) seeded with employment_id=%s",
            emp_data["first"], emp_data["last"], emp_data["code"], employment.id,
        )

    return employments


async def seed_platforms(session) -> dict[str, Platform]:
    platforms = {}
    for name, desc in PLATFORMS:
        p = await get_or_create(
            session, Platform,
            defaults={"description": desc, "changed_by": SYSTEM_EMP_ID},
            name=name,
        )
        platforms[name] = p
    log.info("Platforms seeded: %s", list(platforms.keys()))
    return platforms


async def seed_clients(session) -> dict[str, Client]:
    clients = {}
    for cname, industry, country, ctype in CLIENTS:
        c = await get_or_create(
            session,
            Client,
            defaults={
                "industry": industry,
                "client_type": ctype,
                "country": country,
                "changed_by": SYSTEM_EMP_ID,
            },
            client_name=cname,
        )
        clients[cname] = c

    # Add contacts for key clients
    acme = clients.get("Acme Corporation")
    if acme:
        await get_or_create(
            session,
            ClientContact,
            defaults={
                "designation": "CTO",
                "email": "cto@acme-corp.example.com",
                "phone": "+1-555-0101",
                "changed_by": SYSTEM_EMP_ID,
            },
            client_id=acme.id,
            name="James Acme",
        )

    globex = clients.get("Globex Industries")
    if globex:
        await get_or_create(
            session,
            ClientContact,
            defaults={
                "designation": "VP Procurement",
                "email": "vp@globex-ind.example.com",
                "phone": "+1-555-0202",
                "changed_by": SYSTEM_EMP_ID,
            },
            client_id=globex.id,
            name="Helen Globex",
        )

    log.info("Clients seeded: %s", list(clients.keys()))
    return clients


async def seed_leads(
    session,
    clients: dict[str, Client],
    platforms: dict[str, Platform],
    employments: dict[str, Employment],
) -> list[Lead]:
    leads_data = [
        {
            "lead_title": "Acme Corp — Cloud Migration",
            "contact_name": "James Acme",
            "contact_title": "CTO",
            "email": "cto@acme-corp.example.com",
            "phone": "+1-555-0101",
            "client": "Acme Corporation",
            "platform": "LinkedIn",
            "status": LeadStatus.MEETING,
            "priority": "High",
            "assigned_code": "SAL-001",
            "quotation": Decimal("150000"),
            "expected_close_date": date(2025, 3, 31),
        },
        {
            "lead_title": "Globex — ERP Integration",
            "contact_name": "Helen Globex",
            "contact_title": "VP Procurement",
            "email": "vp@globex-ind.example.com",
            "phone": "+1-555-0202",
            "client": "Globex Industries",
            "platform": "Referral",
            "status": LeadStatus.PROPOSAL_SENT,
            "priority": "Medium",
            "assigned_code": "SAL-002",
            "quotation": Decimal("80000"),
            "expected_close_date": date(2025, 4, 15),
        },
        {
            "lead_title": "Initech — SaaS Subscription",
            "contact_name": "Ron Initech",
            "contact_title": "Head of Engineering",
            "email": "ron@initech.example.com",
            "client": "Initech Solutions",
            "platform": "Website Inquiry",
            "status": LeadStatus.CHAT_OPEN,
            "priority": "Low",
            "assigned_code": "SAL-001",
            "quotation": Decimal("25000"),
            "expected_close_date": date(2025, 5, 30),
        },
        {
            "lead_title": "Umbrella — Data Analytics Platform",
            "contact_name": "Nina Umbrella",
            "contact_title": "CEO",
            "email": "ceo@umbrella.example.com",
            "client": "Umbrella Consulting",
            "platform": "Email Campaign",
            "status": LeadStatus.NEW,
            "priority": "Critical",
            "assigned_code": "SAL-002",
            "quotation": None,
            "expected_close_date": None,
        },
        {
            "lead_title": "Stark — AI Automation Tool",
            "contact_name": "Tony Stark",
            "contact_title": "Founder",
            "email": "tony@stark.example.com",
            "client": "Stark Ventures",
            "platform": "LinkedIn",
            "status": LeadStatus.WON,
            "priority": "High",
            "assigned_code": "SAL-001",
            "quotation": Decimal("500000"),
            "expected_close_date": date(2024, 12, 31),
        },
    ]

    leads = []
    for ld in leads_data:
        client = clients.get(ld["client"])
        platform = platforms.get(ld["platform"])
        assigned_emp = employments.get(ld.get("assigned_code", ""))

        lead = await get_or_create(
            session,
            Lead,
            defaults={
                "contact_title": ld.get("contact_title"),
                "email": ld.get("email"),
                "phone": ld.get("phone"),
                "quotation": ld.get("quotation"),
                "expected_close_date": ld.get("expected_close_date"),
                "status": ld["status"],
                "priority": ld.get("priority"),
                "client_id": client.id if client else None,
                "platform_id": platform.id if platform else None,
                "assigned_employment_id": assigned_emp.id if assigned_emp else None,
                "auto_create_project": False,
                "changed_by": SYSTEM_EMP_ID,
            },
            lead_title=ld["lead_title"],
            contact_name=ld["contact_name"],
        )
        leads.append(lead)

    log.info("Leads seeded: %d", len(leads))
    return leads


async def seed_teams(session, employments: dict[str, Employment]) -> dict[str, Team]:
    team_lead = employments.get("ENG-003")  # Frank (Tech Lead)
    if team_lead is None:
        log.warning("Team lead ENG-003 not found; skipping team seed")
        return {}

    team = await get_or_create(
        session,
        Team,
        defaults={
            "description": "Core product engineering team",
            "changed_by": SYSTEM_EMP_ID,
        },
        name="Core Engineering",
        team_head_employment_id=team_lead.id,
    )

    # Add members
    for code in ("ENG-001", "ENG-002", "ENG-003"):
        emp = employments.get(code)
        if emp:
            await get_or_create(
                session,
                TeamMember,
                defaults={
                    "team_role": "Lead" if code == "ENG-003" else "Member",
                    "is_member": True,
                },
                team_id=team.id,
                employment_id=emp.id,
            )

    # Sales team
    sales_lead = employments.get("SAL-001")
    if sales_lead:
        sales_team = await get_or_create(
            session,
            Team,
            defaults={
                "description": "Global sales team",
                "changed_by": SYSTEM_EMP_ID,
            },
            name="Sales Team",
            team_head_employment_id=sales_lead.id,
        )
        for code in ("SAL-001", "SAL-002"):
            emp = employments.get(code)
            if emp:
                await get_or_create(
                    session,
                    TeamMember,
                    defaults={
                        "team_role": "Lead" if code == "SAL-001" else "Member",
                        "is_member": True,
                    },
                    team_id=sales_team.id,
                    employment_id=emp.id,
                )
        log.info("Sales team seeded")

    log.info("Teams seeded: Core Engineering, Sales Team")
    return {"Core Engineering": team}


async def seed_projects(
    session,
    clients: dict[str, Client],
    leads: list[Lead],
    employments: dict[str, Employment],
    teams: dict[str, Team],
) -> list[Project]:
    eng_team = teams.get("Core Engineering")
    pm_emp = employments.get("ENG-003")  # Frank (Project Manager role)
    acme = clients.get("Acme Corporation")
    stark = clients.get("Stark Ventures")

    if pm_emp is None or acme is None:
        log.warning("Required project dependencies not found; skipping project seed")
        return []

    projects = []

    # Project 1: Acme Cloud Migration (from won lead)
    stark_won_lead = next((l for l in leads if l.lead_title == "Stark — AI Automation Tool"), None)
    if stark and stark_won_lead:
        p1 = await get_or_create(
            session,
            Project,
            defaults={
                "description": "AI-driven automation platform for Stark Ventures",
                "assignment_type": ProjectAssignmentType.TEAM,
                "assigned_to_id": eng_team.id if eng_team else pm_emp.id,
                "status": ProjectStatus.ACTIVE,
                "phase": ProjectPhase.DEVELOPMENT,
                "created_from": ProjectSource.LEAD,
                "lead_id": stark_won_lead.id,
                "planned_start_date": date(2025, 1, 6),
                "planned_end_date": date(2025, 6, 30),
                "actual_start_date": date(2025, 1, 6),
                "changed_by": SYSTEM_EMP_ID,
            },
            client_id=stark.id,
            project_name="Stark AI Automation Platform",
        )
        projects.append(p1)

    # Project 2: Internal CRM Upgrade
    p2 = await get_or_create(
        session,
        Project,
        defaults={
            "description": "Internal CRM system upgrade and feature additions",
            "assignment_type": ProjectAssignmentType.INDIVIDUAL,
            "assigned_to_id": pm_emp.id,
            "status": ProjectStatus.PLANNED,
            "phase": ProjectPhase.DISCOVERY,
            "created_from": ProjectSource.MANUAL,
            "planned_start_date": date(2025, 3, 1),
            "planned_end_date": date(2025, 8, 31),
            "changed_by": SYSTEM_EMP_ID,
        },
        client_id=acme.id,
        project_name="Acme CRM Upgrade",
    )
    projects.append(p2)

    log.info("Projects seeded: %d", len(projects))
    return projects


async def seed_tasks(session, projects: list[Project], employments: dict[str, Employment]) -> None:
    if not projects:
        return

    alice = employments.get("ENG-001")
    bob = employments.get("ENG-002")
    frank = employments.get("ENG-003")

    for project in projects:
        tasks_def = [
            ("Requirements Analysis", TaskStatus.COMPLETED, TaskPriority.HIGH, alice or frank),
            ("System Architecture Design", TaskStatus.COMPLETED, TaskPriority.CRITICAL, frank),
            ("Backend API Development", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice),
            ("Frontend Integration", TaskStatus.TODO, TaskPriority.MEDIUM, bob),
            ("Testing & QA", TaskStatus.TODO, TaskPriority.HIGH, bob),
            ("Deployment & Handover", TaskStatus.TODO, TaskPriority.MEDIUM, frank),
        ]
        for title, status, priority, assignee in tasks_def:
            task = await get_or_create(
                session,
                Task,
                defaults={
                    "description": f"{title} for {project.project_name}",
                    "assignee_employment_id": assignee.id if assignee else None,
                    "priority": priority,
                    "status": status,
                    "start_date": date(2025, 1, 6),
                    "due_date": date(2025, 3, 31),
                    "estimated_hours": Decimal("40"),
                    "changed_by": SYSTEM_EMP_ID,
                },
                project_id=project.id,
                title=title,
            )

            # Add a time entry for completed/in-progress tasks
            if status in (TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS) and assignee:
                await get_or_create(
                    session,
                    TaskTimeEntry,
                    defaults={"duration_minutes": 480, "description": f"Working on {title}"},
                    task_id=task.id,
                    employment_id=assignee.id,
                    work_date=date(2025, 2, 10),
                )

    log.info("Tasks seeded for %d projects", len(projects))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def seed() -> None:
    async with AsyncSessionLocal() as session:
        # Ensure org settings exist
        org = (await session.execute(select(OrganizationSettings).limit(1))).scalar_one_or_none()
        if org is None:
            session.add(OrganizationSettings(
                company_name="ByteVon",
                default_timezone="Asia/Kolkata",
                default_currency="INR",
            ))
            await session.flush()

        # Get working week from bootstrap seed
        ww = (await session.execute(
            select(WorkingWeek).where(WorkingWeek.name == "Standard Mon\u2013Fri")
        )).scalar_one_or_none()
        ww_id = ww.id if ww else None

        # Core masters
        depts = await seed_departments(session)
        positions = await seed_positions(session)
        locs = await seed_locations(session, ww_id=ww_id)
        shifts = await seed_shifts(session)
        await seed_holiday_calendar(session)
        leave_types = await seed_leave_types(session)
        roles = await seed_roles(session)

        # People
        employments = await seed_employees(session, depts, positions, locs, shifts, roles, leave_types)

        # Sales
        platforms = await seed_platforms(session)
        clients = await seed_clients(session)
        leads = await seed_leads(session, clients, platforms, employments)

        # Projects
        teams = await seed_teams(session, employments)
        projects = await seed_projects(session, clients, leads, employments, teams)
        await seed_tasks(session, projects, employments)

        await session.commit()
        log.info("Demo data seed complete.")
        log.info(
            "Demo accounts created with password: %s",
            DEMO_PASSWORD,
        )
        log.info("Seeded %d demo employees, %d clients, %d leads, %d projects.", 
                 len(employments), len(clients), len(leads), len(projects))


# ---------------------------------------------------------------------------
# KNOWN_GAPS:
# The following schema areas are intentionally NOT seeded here because they
# require running application services (approval engine, payroll calculation):
#
# - Payroll runs / monthly payroll items: salary structures must be defined via UI
# - Approval request / approval action records: require live approval engine
# - Attendance punches and corrections: require date-aware punch logic
# - Notification records: generated by application events, not seeded
# - Document / Note records: linked to running user sessions
# ---------------------------------------------------------------------------


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception:
        log.exception("Demo seed failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
