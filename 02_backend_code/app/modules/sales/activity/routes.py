"""Activity routes — GET /activity."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.core.authorization import require_permission
from app.modules.sales.dependencies import ActivityServiceDep

router = APIRouter(prefix="/activity", tags=["Sales Activity"])


@router.get("", dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def list_activity(service: ActivityServiceDep) -> list[dict[str, Any]]:
    return await service.list_recent()
