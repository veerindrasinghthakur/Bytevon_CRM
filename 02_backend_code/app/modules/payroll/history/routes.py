"""History routes."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Query

from app.modules.payroll.dependencies import HistoryServiceDep

router = APIRouter(prefix="/payroll", tags=["Payroll — History"])


@router.get("/history")
async def payroll_history(
    service: HistoryServiceDep,
    year: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict[str, Any]]:
    return await service.list_history(year=year, search=search, limit=limit)
