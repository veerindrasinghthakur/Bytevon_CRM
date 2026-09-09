"""Admin user list/detail helpers for OrganizationPublicService."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, NotFoundError
from app.modules.organization.schemas.schemas import MessageResponse


class AdminUsersMixin:
    # ==================================================================
    # Admin Users (login accounts — person ↔ employment enrichment)
    # ==================================================================

    def _user_status_label(self, login: "Login", now: Optional[datetime] = None) -> str:
        now = now or datetime.now(timezone.utc)
        if login.locked_until and login.locked_until > now:
            return "Locked"
        if not login.is_active:
            return "Inactive"
        return "Active"

    def _initials(self, name: str) -> str:
        parts = [p for p in name.split() if p]
        if not parts:
            return "U"
        return "".join(p[0] for p in parts[:2]).upper()

    def _format_last_login(self, dt: Optional[datetime]) -> str:
        if dt is None:
            return "Never"
        try:
            return dt.astimezone(timezone.utc).strftime("%d %b %Y, %H:%M")
        except Exception:
            return str(dt)

    async def _resolve_employment_context(self, employment_id: int) -> dict:
        """Load employment + person + current assignment + roles for enrichment."""
        from app.modules.workforce.models import Employment, EmploymentAssignment, Position
        from app.modules.organization.models import Department
        from app.modules.rbac.models import EmployeeRole, Role
        from app.modules.auth.models import Person
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            raise NotFoundError("Employment not found")

        person = await self._session.get(Person, emp.person_id)
        name = (
            f"{person.first_name} {person.last_name}".strip()
            if person
            else emp.employee_code
        )

        asg_stmt = (
            select(EmploymentAssignment)
            .where(
                EmploymentAssignment.employment_id == employment_id,
                EmploymentAssignment.effective_to.is_(None),
            )
            .order_by(EmploymentAssignment.effective_from.desc())
            .limit(1)
        )
        asg = (await self._session.execute(asg_stmt)).scalar_one_or_none()

        dept_name = "—"
        dept_id = None
        position_name = "—"
        if asg:
            dept_id = asg.department_id
            if asg.department_id:
                dept = await self._session.get(Department, asg.department_id)
                if dept:
                    dept_name = dept.name
            if asg.position_id:
                pos = await self._session.get(Position, asg.position_id)
                if pos:
                    position_name = pos.name

        role_rows = (
            await self._session.execute(
                select(EmployeeRole)
                .where(EmployeeRole.employment_id == employment_id)
                .options(selectinload(EmployeeRole.role))
            )
        ).scalars().all()
        role_names = [r.role.name for r in role_rows if r.role]
        role_ids = [str(r.role_id) for r in role_rows]

        return {
            "employment": emp,
            "person": person,
            "name": name,
            "department": dept_name,
            "department_id": dept_id,
            "position": position_name,
            "role": role_names[0] if role_names else "—",
            "role_names": role_names,
            "role_ids": role_ids,
            "employee_code": emp.employee_code,
        }

    async def _last_login_at(self, login_id: int) -> Optional[datetime]:
        from app.modules.auth.models import Session
        from app.core.db.enums import SessionStatus
        from sqlalchemy import select, func

        stmt = (
            select(func.max(Session.last_used_at))
            .where(
                Session.login_id == login_id,
                Session.status == SessionStatus.ACTIVE,
            )
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list_admin_users(
        self,
        *,
        search: Optional[str] = None,
        status: Optional[str] = None,
        department: Optional[str] = None,
        role: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> "AdminUserListResponse":
        from app.modules.auth.models import Login, Person
        from app.modules.workforce.models import Employment
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.modules.organization.schemas.schemas import (
            AdminUserListItem,
            AdminUserListResponse,
        )

        stmt = select(Login).options(selectinload(Login.person)).order_by(Login.id)
        logins = (await self._session.execute(stmt)).scalars().all()
        now = datetime.now(timezone.utc)

        items: list[AdminUserListItem] = []
        for login in logins:
            emp_stmt = (
                select(Employment)
                .where(Employment.person_id == login.person_id)
                .order_by(Employment.joining_date.desc())
                .limit(1)
            )
            emp = (await self._session.execute(emp_stmt)).scalar_one_or_none()
            ctx = (
                await self._resolve_employment_context(emp.id)
                if emp
                else {
                    "name": (
                        f"{login.person.first_name} {login.person.last_name}".strip()
                        if login.person
                        else login.email
                    ),
                    "department": "—",
                    "role": "—",
                    "employee_code": "—",
                    "employment": None,
                }
            )
            last_at = await self._last_login_at(login.id)
            label = self._user_status_label(login, now)
            items.append(
                AdminUserListItem(
                    id=login.id,
                    employmentId=emp.id if emp else 0,
                    name=ctx["name"],
                    email=login.email,
                    role=ctx["role"],
                    department=ctx["department"],
                    status=label,
                    lastLogin=self._format_last_login(last_at),
                    lastLoginAt=last_at,
                    initials=self._initials(ctx["name"]),
                    employeeCode=ctx["employee_code"],
                )
            )

        locked_all = sum(1 for u in items if u.status == "Locked")
        active_all = sum(1 for u in items if u.status == "Active")
        departments = sorted({u.department for u in items if u.department and u.department != "—"})
        roles = sorted({u.role for u in items if u.role and u.role != "—"})

        filtered = items
        if search:
            q = search.lower()
            filtered = [
                u for u in filtered
                if q in u.name.lower()
                or q in u.email.lower()
                or q in u.role.lower()
                or q in u.employeeCode.lower()
                or q in u.department.lower()
            ]
        if status and status.lower() not in ("all", ""):
            filtered = [u for u in filtered if u.status.lower() == status.lower()]
        if department and department.lower() not in ("all", ""):
            filtered = [u for u in filtered if u.department == department]
        if role and role.lower() not in ("all", ""):
            filtered = [u for u in filtered if u.role == role]
        if date_from or date_to:
            def _in_range(u: AdminUserListItem) -> bool:
                if u.lastLoginAt is None:
                    return False
                day = u.lastLoginAt.date().isoformat()
                if date_from and day < date_from:
                    return False
                if date_to and day > date_to:
                    return False
                return True
            filtered = [u for u in filtered if _in_range(u)]

        total = len(filtered)
        page = max(1, page)
        page_size = max(1, min(page_size, 200))
        start = (page - 1) * page_size
        page_items = filtered[start : start + page_size]

        return AdminUserListResponse(
            items=page_items,
            total=total,
            locked=locked_all,
            active=active_all,
            departments=departments,
            roles=roles,
        )

    async def get_admin_user(self, login_id: int) -> "AdminUserDetailResponse":
        from app.modules.auth.models import Login
        from app.modules.workforce.models import Employment
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.modules.organization.schemas.schemas import AdminUserDetailResponse

        login = (
            await self._session.execute(
                select(Login).where(Login.id == login_id).options(selectinload(Login.person))
            )
        ).scalar_one_or_none()
        if login is None:
            raise NotFoundError("User not found")

        emp = (
            await self._session.execute(
                select(Employment)
                .where(Employment.person_id == login.person_id)
                .order_by(Employment.joining_date.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        ctx = (
            await self._resolve_employment_context(emp.id)
            if emp
            else {
                "name": (
                    f"{login.person.first_name} {login.person.last_name}".strip()
                    if login.person
                    else login.email
                ),
                "department": "—",
                "department_id": None,
                "role": "—",
                "role_names": [],
                "role_ids": [],
                "employee_code": "—",
                "person": login.person,
                "employment": None,
            }
        )
        last_at = await self._last_login_at(login.id)
        now = datetime.now(timezone.utc)
        person = ctx.get("person") or login.person
        emp_obj = ctx.get("employment") or emp

        return AdminUserDetailResponse(
            id=login.id,
            employmentId=emp.id if emp else 0,
            email=login.email,
            name=ctx["name"],
            status=self._user_status_label(login, now),
            department=ctx["department"],
            departmentId=ctx.get("department_id"),
            role=ctx["role"],
            roleIds=ctx.get("role_ids") or [],
            roleNames=ctx.get("role_names") or [],
            lastLogin=self._format_last_login(last_at),
            lastLoginAt=last_at,
            initials=self._initials(ctx["name"]),
            employeeCode=ctx["employee_code"],
            failed_attempt_count=login.failed_attempt_count or 0,
            locked_until=login.locked_until,
            person=(
                {
                    "id": person.id,
                    "first_name": person.first_name,
                    "last_name": person.last_name,
                }
                if person
                else None
            ),
            employment=(
                {
                    "id": emp_obj.id,
                    "employee_code": emp_obj.employee_code,
                    "person_id": emp_obj.person_id,
                }
                if emp_obj
                else None
            ),
        )
