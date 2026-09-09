"""Admin user mutations (create/update/lock/archive) for OrganizationPublicService."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import delete, select

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, NotFoundError
from app.core.security.password_manager import PasswordManager
from app.modules.organization.schemas.schemas import (
    AdminUserCreate,
    AdminUserDetailResponse,
    AdminUserUpdate,
    EmploymentWithoutLogin,
    MessageResponse,
)


class AdminUsersMutationsMixin:
    async def create_admin_user(
        self,
        data: "AdminUserCreate",
        *,
        actor_employment_id: Optional[int] = None,
    ) -> "AdminUserDetailResponse":
        from app.modules.authentication.models import Login
        from app.modules.employment.models import Employment
        from app.modules.rbac.models import EmployeeRole, Role

        emp = await self._session.get(Employment, data.employmentId)
        if emp is None:
            raise NotFoundError("Employment not found")

        existing_login = (
            await self._session.execute(
                select(Login).where(Login.person_id == emp.person_id)
            )
        ).scalar_one_or_none()
        if existing_login is not None:
            raise ConflictError("This employee already has a login account")

        email_taken = (
            await self._session.execute(
                select(Login).where(Login.email == data.email.lower().strip())
            )
        ).scalar_one_or_none()
        if email_taken is not None:
            raise ConflictError("Email is already in use")

        pwd = PasswordManager()
        status_raw = (data.status or "ACTIVE").upper()
        is_active = status_raw != "INACTIVE"
        locked_until = None
        if status_raw == "LOCKED":
            locked_until = datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCOUNT_LOCKOUT_MINUTES
            )

        login = Login(
            person_id=emp.person_id,
            email=data.email.lower().strip(),
            password_hash=pwd.hash(data.temporaryPassword),
            failed_attempt_count=0,
            locked_until=locked_until,
            is_active=is_active,
        )
        self._session.add(login)
        await self._flush()

        if data.roleId is not None:
            try:
                role_id_val = int(data.roleId)
            except (TypeError, ValueError):
                role_id_val = None
            if role_id_val is not None:
                role = await self._session.get(Role, role_id_val)
                if role is None:
                    raise NotFoundError("Role not found")
                existing_er = (
                    await self._session.execute(
                        select(EmployeeRole).where(
                            EmployeeRole.employment_id == emp.id,
                            EmployeeRole.role_id == role_id_val,
                        )
                    )
                ).scalar_one_or_none()
                if existing_er is None:
                    self._session.add(
                        EmployeeRole(
                            employment_id=emp.id,
                            role_id=role_id_val,
                            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
                        )
                    )

        await self._commit()
        await self._audit("login.created", login.id, actor_employment_id)
        return await self.get_admin_user(login.id)

    async def update_admin_user(
        self,
        login_id: int,
        data: "AdminUserUpdate",
        *,
        actor_employment_id: Optional[int] = None,
    ) -> "AdminUserDetailResponse":
        from app.modules.authentication.models import Login
        from app.modules.employment.models import Employment, EmploymentAssignment
        from app.modules.rbac.models import EmployeeRole, Role

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")

        payload = data.model_dump(exclude_unset=True)

        if "email" in payload and payload["email"]:
            new_email = str(payload["email"]).lower().strip()
            if new_email != login.email:
                taken = (
                    await self._session.execute(
                        select(Login).where(Login.email == new_email, Login.id != login_id)
                    )
                ).scalar_one_or_none()
                if taken:
                    raise ConflictError("Email is already in use")
                login.email = new_email

        if "temporaryPassword" in payload and payload["temporaryPassword"]:
            login.password_hash = PasswordManager().hash(payload["temporaryPassword"])

        if "status" in payload and payload["status"]:
            st = str(payload["status"]).strip().lower()
            if st == "active":
                login.is_active = True
                login.locked_until = None
                login.failed_attempt_count = 0
            elif st == "inactive":
                login.is_active = False
            elif st == "locked":
                login.is_active = True
                login.locked_until = datetime.now(timezone.utc) + timedelta(
                    minutes=settings.ACCOUNT_LOCKOUT_MINUTES
                )
                login.failed_attempt_count = settings.MAX_FAILED_LOGIN_ATTEMPTS

        if "failed_attempt_count" in payload and payload["failed_attempt_count"] is not None:
            login.failed_attempt_count = int(payload["failed_attempt_count"])
        if "locked_until" in payload:
            login.locked_until = payload["locked_until"]

        emp = (
            await self._session.execute(
                select(Employment)
                .where(Employment.person_id == login.person_id)
                .order_by(Employment.joining_date.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        if emp and "departmentId" in payload and payload["departmentId"] is not None:
            dept_id = int(payload["departmentId"])
            dept = await self._repo.get_department_by_id(dept_id)
            if dept is None:
                raise NotFoundError("Department not found")
            asg = (
                await self._session.execute(
                    select(EmploymentAssignment).where(
                        EmploymentAssignment.employment_id == emp.id,
                        EmploymentAssignment.effective_to.is_(None),
                    )
                )
            ).scalar_one_or_none()
            if asg:
                asg.department_id = dept_id

        if emp and "roleId" in payload and payload["roleId"] is not None:
            try:
                role_id_val = int(payload["roleId"])
            except (TypeError, ValueError):
                role_id_val = None
            if role_id_val is not None:
                role = await self._session.get(Role, role_id_val)
                if role is None:
                    raise NotFoundError("Role not found")
                existing = (
                    await self._session.execute(
                        select(EmployeeRole).where(
                            EmployeeRole.employment_id == emp.id,
                            EmployeeRole.role_id == role_id_val,
                        )
                    )
                ).scalar_one_or_none()
                if existing is None:
                    self._session.add(
                        EmployeeRole(
                            employment_id=emp.id,
                            role_id=role_id_val,
                            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
                        )
                    )

        await self._commit()
        await self._audit("login.updated", login_id, actor_employment_id)
        return await self.get_admin_user(login_id)

    async def deactivate_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        from app.modules.authentication.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.is_active = False
        await self._commit()
        await self._audit("login.deactivated", login_id, actor_employment_id)
        return MessageResponse(message="User deactivated")

    async def activate_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        from app.modules.authentication.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.is_active = True
        login.failed_attempt_count = 0
        login.locked_until = None
        await self._commit()
        await self._audit("login.activated", login_id, actor_employment_id)
        return MessageResponse(message="User activated")

    async def lock_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        from app.modules.authentication.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.locked_until = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCOUNT_LOCKOUT_MINUTES
        )
        login.failed_attempt_count = settings.MAX_FAILED_LOGIN_ATTEMPTS
        await self._commit()
        await self._audit("login.locked", login_id, actor_employment_id)
        return MessageResponse(message="User locked")

    async def unlock_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        from app.modules.authentication.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.locked_until = None
        login.failed_attempt_count = 0
        login.is_active = True
        await self._commit()
        await self._audit("login.unlocked", login_id, actor_employment_id)
        return MessageResponse(message="User unlocked")

    async def archive_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        """Hard-remove login credentials. Employment remains (without login)."""
        from app.modules.authentication.models import Login, Session, PasswordResetToken

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")

        await self._session.execute(delete(Session).where(Session.login_id == login_id))
        await self._session.execute(
            delete(PasswordResetToken).where(PasswordResetToken.login_id == login_id)
        )
        await self._session.delete(login)
        await self._commit()
        await self._audit("login.archived", login_id, actor_employment_id)
        return MessageResponse(message="User credentials archived")

    async def list_employments_without_login(self) -> list["EmploymentWithoutLogin"]:
        from app.modules.authentication.models import Login
        from app.modules.employment.models import Employment

        person_ids_with_login = (
            await self._session.execute(select(Login.person_id))
        ).scalars().all()
        person_set = set(person_ids_with_login)

        emps = (
            await self._session.execute(select(Employment).order_by(Employment.employee_code))
        ).scalars().all()

        result: list[EmploymentWithoutLogin] = []
        for emp in emps:
            if emp.person_id in person_set:
                continue
            ctx = await self._resolve_employment_context(emp.id)
            result.append(
                EmploymentWithoutLogin(
                    employmentId=emp.id,
                    employeeCode=emp.employee_code,
                    name=ctx["name"],
                    department=ctx["department"],
                    position=ctx.get("position") or "—",
                    joiningDate=emp.joining_date,
                )
            )
        return result
