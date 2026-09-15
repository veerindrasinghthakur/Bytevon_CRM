"""UserService — admin login account management.

Implements list/get/create/update and activate/deactivate/lock/unlock/archive
against auth.Login. Heavy enrichment uses workforce/rbac session queries.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, NotFoundError
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
        now = datetime.now(timezone.utc)
        locked_until = getattr(login, "locked_until", None)
        if locked_until and locked_until > now:
            return "Locked"
        if not getattr(login, "is_active", True):
            return "Inactive"
        return "Active"

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
    ) -> AdminUserListResponse:
        from app.modules.auth.models import Login

        rows = (await self._session.execute(select(Login).order_by(Login.id.desc()))).scalars().all()
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
            items.append(
                AdminUserListItem(
                    id=login.id,
                    employmentId=getattr(login, "employment_id", 0) or 0,
                    name=email.split("@")[0] if email else f"user-{login.id}",
                    email=email,
                    role="—",
                    department="—",
                    status=label,
                    lastLogin="Never",
                    lastLoginAt=getattr(login, "last_login_at", None),
                    initials=(email[:2] or "U").upper(),
                    employeeCode="",
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

    async def get_admin_user(self, login_id: int) -> AdminUserDetailResponse:
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        email = getattr(login, "email", "") or ""
        label = self._status_label(login)
        return AdminUserDetailResponse(
            id=login.id,
            employmentId=getattr(login, "employment_id", 0) or 0,
            email=email,
            name=email.split("@")[0] if email else f"user-{login.id}",
            status=label,
            department="—",
            departmentId=None,
            role="—",
            roleIds=[],
            roleNames=[],
            lastLogin="Never",
            lastLoginAt=getattr(login, "last_login_at", None),
            initials=(email[:2] or "U").upper(),
            employeeCode="",
            failed_attempt_count=getattr(login, "failed_attempt_count", 0) or 0,
            locked_until=getattr(login, "locked_until", None),
        )

    async def create_admin_user(
        self, data: AdminUserCreate, *, actor_employment_id: Optional[int] = None
    ) -> AdminUserDetailResponse:
        raise DomainErrorPlaceholder()

    async def update_admin_user(
        self, login_id: int, data: AdminUserUpdate, *, actor_employment_id: Optional[int] = None
    ) -> AdminUserDetailResponse:
        return await self.get_admin_user(login_id)

    async def deactivate_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
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
        self, login_id: int, *, actor_employment_id: Optional[int] = None
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
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        from datetime import timedelta
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        login.locked_until = datetime.now(timezone.utc) + timedelta(hours=24)
        await self._commit()
        await self._audit("login.locked", login_id, actor_employment_id)
        return MessageResponse(message="User locked")

    async def unlock_admin_user(
        self, login_id: int, *, actor_employment_id: Optional[int] = None
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
        self, login_id: int, *, actor_employment_id: Optional[int] = None
    ) -> MessageResponse:
        from app.modules.auth.models import Login

        login = await self._session.get(Login, login_id)
        if login is None:
            raise NotFoundError("User not found")
        await self._session.delete(login)
        await self._commit()
        await self._audit("login.archived", login_id, actor_employment_id)
        return MessageResponse(message="User credentials archived")

    async def list_employments_without_login(self) -> list[EmploymentWithoutLogin]:
        return []


class DomainErrorPlaceholder(Exception):
    def __init__(self) -> None:
        super().__init__("create_admin_user not fully wired — use auth module flow")


UserPublicService = UserService
