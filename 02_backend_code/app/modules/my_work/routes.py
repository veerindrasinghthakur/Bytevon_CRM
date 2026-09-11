"""
My-work HTTP facade — frontend my-work + profile surfaces.

Profile lives under this package (not a separate backend module).
HTTP paths stay /my-work/* and /profile/* to match the frontend clients.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query

from app.modules.auth.dependencies import AuthenticationServiceDep

router = APIRouter(prefix="/my-work", tags=["My Work"])
profile_router = APIRouter(prefix="/profile", tags=["My Work — Profile"])

EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]
LoginHeader = Annotated[Optional[int], Header(alias="X-Login-Id")]


# ---------------------------------------------------------------------------
# My work — attendance / approvers
# ---------------------------------------------------------------------------


@router.get("/attendance/today-info")
async def today_info(
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
    return {
        "employmentId": x_employment_id,
        "todayLabel": "Today",
        "shift": "—",
        "status": "UNKNOWN",
        "checkIn": None,
        "checkOut": None,
        "workedMinutes": 0,
        "breakMinutes": 0,
    }


@router.get("/attendance/week-hours")
async def week_hours(
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
    return {
        "employmentId": x_employment_id,
        "days": [],
        "totalMinutes": 0,
    }


@router.get("/attendance/corrections")
async def list_corrections(
    x_employment_id: EmploymentHeader = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


@router.get("/attendance/correction-candidates")
async def correction_candidates(
    x_employment_id: EmploymentHeader = None,
) -> list[dict[str, Any]]:
    return []


@router.get("/approvers")
async def list_approvers(
    x_employment_id: EmploymentHeader = None,
) -> list[dict[str, Any]]:
    """Approver picker options — empty until org graph is wired."""
    return []


# ---------------------------------------------------------------------------
# Profile (frontend: modules/profile under my-work area)
# ---------------------------------------------------------------------------


@profile_router.get("/me")
async def get_me(
    x_login_id: LoginHeader = None,
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
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


@profile_router.patch("/me")
async def update_me(body: dict[str, Any]) -> dict[str, Any]:
    return {"ok": True, **body}


@profile_router.get("/activity")
async def profile_activity(
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    return {"items": [], "total": 0, "limit": limit}


@profile_router.get("/sessions")
async def profile_sessions(
    service: AuthenticationServiceDep,
    x_login_id: Annotated[int, Header(alias="X-Login-Id")],
) -> list[Any]:
    return await service.list_sessions(x_login_id)
