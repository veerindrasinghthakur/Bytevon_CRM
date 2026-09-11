"""
My-work HTTP facade — paths the frontend expects under /my-work/*.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query

router = APIRouter(prefix="/my-work", tags=["My Work"])

EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


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
