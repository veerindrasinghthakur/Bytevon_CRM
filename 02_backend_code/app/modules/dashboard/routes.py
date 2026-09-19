"""Executive dashboard stub — replace with real aggregations later."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.core.authorization import require_permission

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/executive", dependencies=[Depends(require_permission("employment", "VIEW", "ORGANIZATION"))])
async def executive_dashboard() -> dict[str, Any]:
    return {
        "kpis": [],
        "recentActivities": [],
        "pipeline": [],
        "attendance": None,
        "approvalsPending": 0,
        "message": "Dashboard aggregations not wired yet",
    }
