"""My Work Requests routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.my_work.requests.schemas import RequestListResponse
from app.modules.my_work.requests.service import MyWorkRequestsService

router = APIRouter(prefix="/my-work/requests", tags=["My Work / Requests"])


def get_requests_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MyWorkRequestsService:
    return MyWorkRequestsService(session)


ServiceDep = Annotated[MyWorkRequestsService, Depends(get_requests_service)]


@router.get("", response_model=RequestListResponse)
async def list_my_requests(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("approval", "VIEW", "SELF"))],
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
) -> RequestListResponse:
    return await service.list_my_requests(
        employment_id=auth.employment_id,
        status=status_filter,
        search=search,
        limit=20,
    )
