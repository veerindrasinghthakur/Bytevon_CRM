"""Admin user routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.core.database import get_db_session
from app.modules.admin.user.schemas import (
    AdminUserCreate,
    AdminUserDetailResponse,
    AdminUserListResponse,
    AdminUserUpdate,
    EmploymentWithoutLogin,
    MessageResponse,
)
from app.modules.admin.user.service import UserService

router = APIRouter(tags=["Admin / Users"])


def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> UserService:
    return UserService(session)


ServiceDep = Annotated[UserService, Depends(get_service)]


@router.get("/users", response_model=AdminUserListResponse, dependencies=[Depends(require_permission("user", "VIEW", "ORGANIZATION"))])
async def list_users(
    service: ServiceDep,
    search: str | None = Query(None),
    user_status: str | None = Query(None, alias="status"),
    department: str | None = Query(None),
    role: str | None = Query(None),
    dateFrom: str | None = Query(None),
    dateTo: str | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
) -> AdminUserListResponse:
    return await service.list_admin_users(
        search=search,
        status=user_status,
        department=department,
        role=role,
        date_from=dateFrom,
        date_to=dateTo,
        page=page,
        page_size=pageSize,
    )


@router.get("/employments-without-login", response_model=list[EmploymentWithoutLogin], dependencies=[Depends(require_permission("user", "VIEW", "ORGANIZATION"))])
async def list_employments_without_login(service: ServiceDep) -> list[EmploymentWithoutLogin]:
    return await service.list_employments_without_login()


@router.get("/users/{login_id}", response_model=AdminUserDetailResponse)
async def get_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "VIEW", "SELF", union=True))],
    include_archived: bool = Query(False),
) -> AdminUserDetailResponse:
    enforce_owner_or_grant(auth, "user", "VIEW", owner_login_id=login_id)
    return await service.get_admin_user(login_id, include_archived=include_archived)


@router.post("/users", response_model=AdminUserDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminUserCreate,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "CREATE", "ORGANIZATION"))],
) -> AdminUserDetailResponse:
    return await service.create_admin_user(body, actor_employment_id=auth.employment_id)


@router.patch("/users/{login_id}", response_model=AdminUserDetailResponse)
async def update_user(
    login_id: int,
    body: AdminUserUpdate,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UPDATE", "SELF", union=True))],
) -> AdminUserDetailResponse:
    enforce_owner_or_grant(auth, "user", "UPDATE", owner_login_id=login_id)
    return await service.update_admin_user(login_id, body, actor_employment_id=auth.employment_id)


@router.post("/users/{login_id}/deactivate", response_model=MessageResponse)
async def deactivate_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.deactivate_admin_user(login_id, actor_employment_id=auth.employment_id)


@router.post("/users/{login_id}/activate", response_model=MessageResponse)
async def activate_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.activate_admin_user(login_id, actor_employment_id=auth.employment_id)


@router.post("/users/{login_id}/lock", response_model=MessageResponse)
async def lock_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.lock_admin_user(login_id, actor_employment_id=auth.employment_id)


@router.post("/users/{login_id}/unlock", response_model=MessageResponse)
async def unlock_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UNLOCK", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.unlock_admin_user(login_id, actor_employment_id=auth.employment_id)


@router.post("/users/{login_id}/archive", response_model=MessageResponse)
async def archive_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.archive_admin_user(login_id, actor_employment_id=auth.employment_id)


@router.delete("/users/{login_id}", response_model=MessageResponse)
async def delete_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "DELETE", "SELF", union=True))],
) -> MessageResponse:
    enforce_owner_or_grant(auth, "user", "DELETE", owner_login_id=login_id)
    return await service.archive_admin_user(login_id, actor_employment_id=auth.employment_id)


@router.post("/users/{login_id}/restore", response_model=MessageResponse)
async def restore_user(
    login_id: int,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("user", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.restore_admin_user(login_id, actor_employment_id=auth.employment_id)
