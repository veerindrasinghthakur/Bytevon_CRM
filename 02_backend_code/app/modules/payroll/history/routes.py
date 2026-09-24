"""History routes."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.core.authorization import AuthContext, enforce_owner_or_grant, require_permission
from app.modules.payroll.dependencies import HistoryServiceDep

router = APIRouter(prefix="/payroll", tags=["Payroll — History"])


@router.get("/history", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def payroll_history(
    service: HistoryServiceDep,
    year: int | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    return await service.list_history(year=year, search=search, limit=limit)


@router.get("/employees/{employment_id}/history")
async def employee_payroll_history(
    employment_id: int,
    service: HistoryServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("payroll", "VIEW", "SELF"))],
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    """Per-employment history; employment_id path (not payroll_id)."""
    enforce_owner_or_grant(auth, "payroll", "VIEW", owner_employment_id=employment_id)
    return await service.list_employee_history(employment_id, limit=limit)
