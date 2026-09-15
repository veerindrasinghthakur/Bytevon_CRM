"""Profile routes under /profile (not /my-work/profile)."""
from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query

from app.modules.my_work.dependencies import ProfileServiceDep
from app.modules.my_work.profile.schemas import (
    ProfileActivityResponse,
    ProfileMeResponse,
)

router = APIRouter(prefix="/profile", tags=["My Work — Profile"])

EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]
LoginHeader = Annotated[Optional[int], Header(alias="X-Login-Id")]


@router.get("/me", response_model=ProfileMeResponse)
async def get_me(
    service: ProfileServiceDep,
    x_login_id: LoginHeader = None,
    x_employment_id: EmploymentHeader = None,
) -> ProfileMeResponse:
    return await service.get_me(
        login_id=x_login_id, employment_id=x_employment_id
    )


@router.patch("/me")
async def update_me(
    body: dict[str, Any],
    service: ProfileServiceDep,
) -> dict[str, Any]:
    return await service.update_me(body)


@router.get("/activity", response_model=ProfileActivityResponse)
async def profile_activity(
    service: ProfileServiceDep,
    limit: int = Query(20, ge=1, le=100),
) -> ProfileActivityResponse:
    return await service.activity(limit=limit)


@router.get("/sessions")
async def profile_sessions(
    service: ProfileServiceDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
) -> list[Any]:
    return await service.list_sessions(x_login_id)
