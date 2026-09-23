"""Activity routes — GET /activity."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.authorization import require_permission
from app.modules.sales.dependencies import ActivityServiceDep

router = APIRouter(prefix="/activity", tags=["Sales Activity"])


@router.get("", dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def list_activity(
    service: ActivityServiceDep,
    lead_id: int | None = Query(None),
    limit: int = Query(10, ge=1, le=100),
) -> list[dict[str, Any]]:
    return await service.list_recent(limit=limit, lead_id=lead_id)
