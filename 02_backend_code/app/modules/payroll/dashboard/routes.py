"""Dashboard routes."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.authorization import require_permission
from app.modules.payroll.dependencies import DashboardServiceDep

router = APIRouter(prefix="/payroll", tags=["Payroll — Dashboard"])


@router.get("/kpis", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def payroll_kpis(
    service: DashboardServiceDep,
    year: int | None = Query(None),
    month: int | None = Query(None),
) -> dict[str, Any]:
    return await service.kpis(year=year, month=month)


@router.get("/period", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def payroll_period(service: DashboardServiceDep) -> dict[str, Any]:
    return await service.period()


@router.get("/activity", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def payroll_activity(
    service: DashboardServiceDep,
    limit: int = Query(20, ge=1, le=100),
) -> list[dict[str, Any]]:
    return await service.activity(limit=limit)


@router.get("/monthly-summary", dependencies=[Depends(require_permission("payroll", "VIEW", "ORGANIZATION"))])
async def monthly_summary(
    service: DashboardServiceDep,
    year: int | None = Query(None),
    month: int | None = Query(None),
) -> dict[str, Any]:
    return await service.monthly_summary(year=year, month=month)
