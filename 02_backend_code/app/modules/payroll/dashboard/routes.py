"""Dashboard routes."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Query

from app.modules.payroll.dependencies import DashboardServiceDep

router = APIRouter(prefix="/payroll", tags=["Payroll — Dashboard"])


@router.get("/kpis")
async def payroll_kpis(
    service: DashboardServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
) -> dict[str, Any]:
    return await service.kpis(year=year, month=month)


@router.get("/period")
async def payroll_period(service: DashboardServiceDep) -> dict[str, Any]:
    return service.period()


@router.get("/activity")
async def payroll_activity(
    service: DashboardServiceDep,
    limit: int = Query(20, ge=1, le=100),
) -> list[dict[str, Any]]:
    return await service.activity(limit=limit)


@router.get("/monthly-summary")
async def monthly_summary(
    service: DashboardServiceDep,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
) -> dict[str, Any]:
    return await service.monthly_summary(year=year, month=month)
