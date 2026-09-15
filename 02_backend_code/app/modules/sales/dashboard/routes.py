"""Dashboard routes — GET /dashboard, GET /analytics."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.modules.sales.dependencies import DashboardServiceDep

router = APIRouter(tags=["Sales Dashboard"])


@router.get("/dashboard")
async def dashboard_metrics(service: DashboardServiceDep) -> list[dict[str, Any]]:
    return await service.metrics()


@router.get("/analytics")
async def analytics(service: DashboardServiceDep) -> list[dict[str, Any]]:
    return await service.analytics()


# Legacy path used by frontend
@router.get("/metrics/dashboard")
async def metrics_dashboard_legacy(service: DashboardServiceDep) -> list[dict[str, Any]]:
    return await service.metrics()
