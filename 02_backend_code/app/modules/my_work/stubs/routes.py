"""
Temporary my-work aggregate stubs so frontend paths stop 404ing.

Real domain implementations can replace these later.
Frontend expects:
  GET /my-work/overview
  GET /my-work/attendance  (list)
  GET /my-work/leave, /leave/balances, /leave/types, /leave/apply-context
  GET /my-work/tasks
  GET /my-work/requests
  GET /my-work/approvals
"""
from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Header, Query

router = APIRouter(prefix="/my-work", tags=["My Work — Stubs"])
EmploymentHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.get("/overview")
async def overview(x_employment_id: EmploymentHeader = None) -> dict[str, Any]:
    return {
        "user": {
            "name": "User",
            "employmentId": x_employment_id,
            "todayLabel": "Today",
            "shift": "—",
        },
        "metrics": [],
        "todayAttendance": None,
        "weekHours": [],
        "leaveBalances": [],
        "tasks": [],
        "notifications": [],
        "events": [],
        "quickActions": [],
    }


@router.get("/attendance")
async def attendance_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    x_employment_id: EmploymentHeader = None,
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


@router.get("/leave")
async def leave_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


@router.get("/leave/balances")
async def leave_balances() -> list:
    return []


@router.get("/leave/types")
async def leave_types() -> list:
    return []


@router.get("/leave/apply-context")
async def leave_apply_context() -> dict[str, Any]:
    return {"holidays": [], "leaveTypes": [], "balances": []}


@router.get("/tasks")
async def tasks_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


@router.get("/requests")
async def requests_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
) -> dict[str, Any]:
    return {"items": [], "total": 0}


@router.get("/approvals")
async def approvals_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
) -> dict[str, Any]:
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}
