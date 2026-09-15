"""Activity routes — GET /activity."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.modules.sales.dependencies import ActivityServiceDep

router = APIRouter(prefix="/activity", tags=["Sales Activity"])


@router.get("")
async def list_activity(service: ActivityServiceDep) -> list[dict[str, Any]]:
    return await service.list_recent()
