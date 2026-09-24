"""UserService — admin login account management.

Implements list/get/create/update and activate/deactivate/lock/unlock/archive
against auth.Login. Heavy enrichment uses workforce/rbac session queries.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.security.password_manager import PasswordManager
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.user.repository import UserRepository
from app.modules.admin.user.schemas import (
    AdminUserCreate,
    AdminUserDetailResponse,
    AdminUserListItem,
    AdminUserListResponse,
    AdminUserUpdate,
    EmploymentWithoutLogin,
    MessageResponse,
)


class UserService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = UserRepository(session)

    def _status_label(self, login: Any) -> str:
        now = datetime.now(UTC)
        if bool(getattr(login, "is_archived", False)):
            return "Archived"
        locked_until = getattr(login, "locked_until", None)
        if locked_until and locked_until > now:
            return "Locked"
        if not getattr(login, "is_active", True):
            return "Inactive"
        return "Active"

    async def _employment_enrichment(self, person_id: int) -> dict[str, Any]:
        """Employment + org enrichment for a person (batched per call)."""
        from app.modules.auth.models import Person
        from app.modules.workforce.department.models import Department
        from app.modules.workforce.models import (
            Employment,
            EmploymentAssignment,
            Position,
        )

        out: dict[str, Any] = {
            "employment_id": 0,
            "employee_code": "",
            "person_name": "",
            "department": "—",
            "department_id": None,
            "position": "—",
            "joining_date": None,
        }
        person = await self._session.get(Person, person_id)
        if person is None:
            return out
        out["person_name"] = f"{person.first_name} {person.last_name}".strip()
        employments = (
            await self._session.execute(
                select(Employment)
                .where(Employment.person_id == person_id)
                .order_by(Employment.id)
            )
        ).scalars().all()
        if not employments:
            return out
        emp = employments[0]
        out["employment_id"] = emp.id
        out["employee_code"] = emp.employee_code
        out["joining_date"] = emp.joining_date
        assignments = (
            await self._session.execute(
                select(EmploymentAssignment)
                .where(EmploymentAssignment.employment_id == emp.id)
                .order_by(EmploymentAssignment.effective_from.desc())
            )
        ).scalars().all()
        current = assignments[0] if assignments else None
        if current is not None:
            if current.department_id is not None:
                dept = await self._session.get(Department, current.department_id)
                if dept is not None:
                    out["department"] = dept.name
                    out["department_id"] = dept.id
            if current.position_id is not None:
                pos = await self._session.get(Position, current.position_id)
                if pos is not None:
                    out["position"] = pos.name
        return out

    async def _roles_summary(self, employment_id: int) -> tuple[list[str], list[str]]:
        from app.modules.rbac.models import EmployeeRole, Role

        if not employment_id:
            return [], []
        rows = (
            await self._session.execute(
                select(Role).join(
                    EmployeeRole, EmployeeRole.role_id == Role.id
                ).where(EmployeeRole.employment_id == employment_id)
            )
        ).scalars().all()
        return [str(r.id) for r in rows], [r.name for r in rows]

    async def list_admin_users(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
        department: str | None = None,
        role: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AdminUserListResponse:
        from app.modules.auth.models import Login

        rows = (
            await self._session.execute(
                select(Login)
                .where(Login.is_archived.is_(False))
                .order_by(Login.id.desc())
            )
        ).scalars().all()
        items: list[AdminUserListItem] = []
        locked = 0
        active = 0
        for login in rows:
            label = self._status_label(login)
            if label == "Locked":
                locked += 1
            if label == "Active":
                active += 1
            email = getattr(login, "email", "") or ""
            if search and search.lower() not in email.lower():
                continue
            if status and status.lower() not in label.lower():
                continue
            enrich = await self._employment_enrichment(login.person_id)
            role_ids, role_names = await self._roles_summary(enrich["employment_id"])
            items.append(
                AdminUserListItem(
                    id=login.id,
                    employmentId=enrich["employment_id"],
                    name=enrich["person_name"] or (email.split("@")[0] if email else f"user-{login.id}"),
                    email=email,
                    role=role_names[0] if role_names else "—",
                    department=enrich["department"],
                    status=label,
                    lastLogin="Never",
                    lastLoginAt=getattr(login, "last_login_at", None),
                    initials=(email[:2] or "U").upper(),
                    employeeCode=enrich["employee_code"],
                )
            )
        total = len(items)
        start = (max(1, page) - 1) * page_size
        page_items = items[start : start + page_size]
        return AdminUserListResponse(
            items=page_items,
            total=total,
            locked=locked,
            active=active,
            departments=[],
            roles=[],
        )

    async def get_admin_user(
        self, login_id: int, *, include_archived: bool = False
    ) -> AdminUserDetailResponse:
        """Q15: archived hidden by default; history views opt in."""
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        if bool(getattr(login, "is_archived", False)) and not include_archived:
            raise NotFoundError("User not found")
        email = getattr(login, "email", "") or ""
        label = self._status_label(login)
        enrich = await self._employment_enrichment(login.person_id)
        role_ids, role_names = await self._roles_summary(enrich["employment_id"])
        return AdminUserDetailResponse(
            id=login.id,
            employmentId=enrich["employment_id"],
            email=email,
            name=enrich["person_name"] or (email.split("@")[0] if email else f"user-{login.id}"),
            status=label,
            department=enrich["department"],
            departmentId=enrich["department_id"],
            role=role_names[0] if role_names else "—",
            roleIds=role_ids,
            roleNames=role_names,
            lastLogin="Never",
            lastLoginAt=getattr(login, "last_login_at", None),
            initials=(email[:2] or "U").upper(),
            employeeCode=enrich["employee_code"],
            failed_attempt_count=getattr(login, "failed_attempt_count", 0) or 0,
            locked_until=getattr(login, "locked_until", None),
        )

    async def _resolve_role(self, role_ref: int | str | None) -> Any:
        """Resolve a role by id or name; raises NotFoundError when missing."""
        if role_ref is None:
            return None
        from app.modules.rbac.models import Role

        role = None
        if isinstance(role_ref, int) or (isinstance(role_ref, str) and role_ref.isdigit()):
            role = await self._session.get(Role, int(role_ref))
        else:
            role = (
                await self._session.execute(select(Role).where(Role.name == role_ref))
            ).scalar_one_or_none()
        if role is None:
            raise NotFoundError(f"Role '{role_ref}' not found")
        return role

    async def create_admin_user(
        self, data: AdminUserCreate, *, actor_employment_id: int | None = None
    ) -> AdminUserDetailResponse:
        from app.modules.auth.models import Login
        from app.modules.rbac.models import EmployeeRole
        from app.modules.workforce.models import Employment

        employment = await self._session.get(Employment, data.employmentId)
        if employment is None:
            raise NotFoundError("Employment not found")
        existing = (
            await self._session.execute(
                select(Login).where(Login.person_id == employment.person_id)
            )
        ).scalar_one_or_none()
        if existing is not None:
            raise ConflictError("A login already exists for this employment")
        email_clash = (
            await self._session.execute(select(Login).where(Login.email == data.email))
        ).scalar_one_or_none()
        if email_clash is not None:
            raise ConflictError(f"Login email '{data.email}' already exists")
        role = await self._resolve_role(data.roleId)
        login = Login(
            person_id=employment.person_id,
            email=data.email,
            password_hash=PasswordManager().hash(data.temporaryPassword),
            is_active=(data.status or "ACTIVE").upper() != "INACTIVE",
            failed_attempt_count=0,
        )
        self._session.add(login)
        await self._session.flush()
        if role is not None:
            self._session.add(
                EmployeeRole(
                    employment_id=employment.id,
                    role_id=role.id,
                    changed_by=actor_employment_id,
                )
            )
        await self._commit()
        await self._audit("login.created", login.id, actor_employment_id)
        return await self.get_admin_user(login.id)

    async def update_admin_user(
        self, login_id: int, data: AdminUserUpdate, *, actor_employment_id: int | None = None
    ) -> AdminUserDetailResponse:
        from app.modules.auth.models import Login
        from app.modules.rbac.models import EmployeeRole

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        if data.email is not None and data.email != login.email:
            clash = (
                await self._session.execute(
                    select(Login).where(Login.email == data.email, Login.id != login_id)
                )
            ).scalar_one_or_none()
            if clash is not None:
                raise ConflictError(f"Login email '{data.email}' already exists")
            login.email = data.email
        if data.temporaryPassword is not None:
            login.password_hash = PasswordManager().hash(data.temporaryPassword)
            login.failed_attempt_count = 0
            login.locked_until = None
        if data.status is not None:
            login.is_active = data.status.upper() != "INACTIVE"
        if data.failed_attempt_count is not None:
            login.failed_attempt_count = data.failed_attempt_count
        if data.locked_until is not None:
            login.locked_until = data.locked_until
        if data.roleId is not None:
            from app.modules.workforce.models import Employment

            role = await self._resolve_role(data.roleId)
            employment = (
                await self._session.execute(
                    select(Employment)
                    .where(Employment.person_id == login.person_id)
                    .order_by(Employment.id)
                )
            ).scalars().first()
            if employment is None:
                raise DomainError("Cannot assign role: no employment for this login")
            existing = (
                await self._session.execute(
                    select(EmployeeRole).where(
                        EmployeeRole.employment_id == employment.id,
                        EmployeeRole.role_id == role.id,
                    )
                )
            ).scalar_one_or_none()
            if existing is None:
                self._session.add(
                    EmployeeRole(
                        employment_id=employment.id,
                        role_id=role.id,
                        changed_by=actor_employment_id,
                    )
                )
        await self._commit()
        await self._audit("login.updated", login_id, actor_employment_id)
        return await self.get_admin_user(login_id)

    async def deactivate_admin_user(
        self, login_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.is_active = False
        await self._commit()
        await self._audit("login.deactivated", login_id, actor_employment_id)
        return MessageResponse(message="User deactivated")

    async def activate_admin_user(
        self, login_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.is_active = True
        await self._commit()
        await self._audit("login.activated", login_id, actor_employment_id)
        return MessageResponse(message="User activated")

    async def lock_admin_user(
        self, login_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        from datetime import timedelta

        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.locked_until = datetime.now(UTC) + timedelta(hours=24)
        await self._commit()
        await self._audit("login.locked", login_id, actor_employment_id)
        return MessageResponse(message="User locked")

    async def unlock_admin_user(
        self, login_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.locked_until = None
        login.failed_attempt_count = 0
        await self._commit()
        await self._audit("login.unlocked", login_id, actor_employment_id)
        return MessageResponse(message="User unlocked")

    async def archive_admin_user(
        self, login_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        from datetime import UTC, datetime

        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None or bool(getattr(login, "is_archived", False)):
            raise NotFoundError("User not found")
        # Soft-delete only: never hard-delete login rows (FKs + history).
        login.is_active = False
        login.is_archived = True
        login.archived_at = datetime.now(UTC)
        if hasattr(login, "archived_by"):
            login.archived_by = actor_employment_id
        await self._commit()
        await self._audit("login.deleted", login_id, actor_employment_id)
        return MessageResponse(message="User deleted")

    async def restore_admin_user(
        self, login_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        """Q16: restore an archived login (reactivate access)."""
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        if not bool(getattr(login, "is_archived", False)):
            raise DomainError("User is not archived")
        login.is_archived = False
        login.archived_at = None
        if hasattr(login, "archived_by"):
            login.archived_by = None
        login.is_active = True
        login.failed_attempt_count = 0
        login.locked_until = None
        await self._commit()
        await self._audit("login.restored", login_id, actor_employment_id)
        return MessageResponse(message="User restored")

    async def list_employments_without_login(self) -> list[EmploymentWithoutLogin]:
        from app.modules.auth.models import Login, Person
        from app.modules.workforce.models import Employment

        employed_person_ids = select(Employment.person_id).distinct()
        logged_person_ids = select(Login.person_id).distinct()
        orphans = (
            await self._session.execute(
                select(Employment).where(
                    Employment.person_id.in_(employed_person_ids),
                    ~Employment.person_id.in_(logged_person_ids),
                ).order_by(Employment.id)
            )
        ).scalars().all()
        items: list[EmploymentWithoutLogin] = []
        for emp in orphans:
            enrich = await self._employment_enrichment(emp.person_id)
            person = await self._session.get(Person, emp.person_id)
            name = (
                f"{person.first_name} {person.last_name}".strip()
                if person is not None
                else enrich["person_name"]
            )
            items.append(
                EmploymentWithoutLogin(
                    employmentId=emp.id,
                    employeeCode=emp.employee_code,
                    name=name,
                    department=enrich["department"],
                    position=enrich["position"],
                    joiningDate=emp.joining_date,
                )
            )
        return items


UserPublicService = UserService
