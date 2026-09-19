"""Profile routes under /profile (not /my-work/profile)."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Query

from app.core.authorization import AuthContext, require_permission
from app.core.dependencies import CurrentLoginDep
from app.core.exceptions.exception import ForbiddenError
from app.modules.auth.dependencies import AuthenticationServiceDep
from app.modules.my_work.dependencies import ProfileServiceDep
from app.modules.my_work.profile.schemas import (
    ProfileActivityResponse,
    ProfileMeResponse,
)

router = APIRouter(prefix="/profile", tags=["My Work — Profile"])


@router.get("/me", response_model=ProfileMeResponse)
async def get_me(
    service: ProfileServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
) -> ProfileMeResponse:
    return await service.get_me(
        login_id=auth.login_id, employment_id=auth.employment_id
    )


@router.patch("/me")
async def update_me(
    body: dict[str, Any],
    service: ProfileServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "UPDATE", "SELF"))],
) -> dict[str, Any]:
    return await service.update_me(body)


@router.get("/activity", response_model=ProfileActivityResponse)
async def profile_activity(
    service: ProfileServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
    limit: int = Query(20, ge=1, le=100),
) -> ProfileActivityResponse:
    return await service.activity(limit=limit)


@router.get("/sessions")
async def profile_sessions(
    service: ProfileServiceDep,
    auth: AuthenticationServiceDep,
    login: CurrentLoginDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
) -> list[Any]:
    if x_login_id != login.id:
        raise ForbiddenError("Cannot list another login's sessions")
    return await service.list_sessions(x_login_id, auth)
