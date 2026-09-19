"""History routes."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.authorization import require_permission
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
