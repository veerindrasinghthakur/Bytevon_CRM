"""Executive dashboard — real aggregations over domain tables."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.dashboard.attendance.routes import router as attendance_router
from app.modules.dashboard.service import ExecutiveDashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
router.include_router(attendance_router)


def get_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExecutiveDashboardService:
    return ExecutiveDashboardService(session)


ServiceDep = Annotated[ExecutiveDashboardService, Depends(get_service)]


@router.get("/executive")
async def executive_dashboard(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
) -> dict[str, Any]:
    """Scope-aware aggregations — data is filtered by the caller's grants."""
    return await service.get_executive(auth=auth)


@router.get("/employee")
async def employee_dashboard(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("employment", "VIEW", "SELF"))],
) -> dict[str, Any]:
    """Self dashboard — hero, KPIs, week bars, leave summary, my tasks."""
    return await service.get_employee(auth=auth)
