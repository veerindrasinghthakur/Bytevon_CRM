"""
Profile HTTP facade used by the frontend profile module.
Maps to auth sessions + employment/person where possible.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query

from app.modules.auth.dependencies import AuthServiceDep

router = APIRouter(prefix="/profile", tags=["Profile"])

LoginHeader = Annotated[Optional[int], Header(alias="X-Login-Id")]
EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.get("/me")
async def get_me(
    x_login_id: LoginHeader = None,
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
    """Minimal current-user profile for the UI."""
    return {
        "loginId": x_login_id,
        "employmentId": x_employment_id,
        "name": "",
        "email": "",
        "avatarUrl": None,
        "title": "",
        "department": "",
        "phone": "",
    }


@router.patch("/me")
async def update_me(body: dict[str, Any]) -> dict[str, Any]:
    return {"ok": True, **body}


@router.get("/activity")
async def profile_activity(
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """Activity feed for profile — empty until audit is wired per-user."""
    return {"items": [], "total": 0, "limit": limit}


@router.get("/sessions")
async def profile_sessions(
    service: AuthServiceDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
) -> list[Any]:
    return await service.list_sessions(x_login_id)
