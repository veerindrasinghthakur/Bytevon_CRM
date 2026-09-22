"""Real GET /my-work/overview (SELF scope aggregate)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.authorization import AuthContext, require_permission
from app.modules.my_work.dependencies import MyWorkOverviewServiceDep
from app.modules.my_work.overview.schemas import MyWorkOverviewResponse

router = APIRouter(prefix="/my-work", tags=["My Work — Overview"])


@router.get("/overview", response_model=MyWorkOverviewResponse)
async def get_overview(
    service: MyWorkOverviewServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("attendance", "VIEW", "SELF"))],
) -> MyWorkOverviewResponse:
    return await service.get_overview(login_id=auth.login_id, employment_id=auth.employment_id)
