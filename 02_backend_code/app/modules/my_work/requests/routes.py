"""My Work Requests routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.database import get_db_session
from app.modules.my_work.requests.schemas import RequestListResponse
from app.modules.my_work.requests.service import MyWorkRequestsService

router = APIRouter(prefix="/my-work/requests", tags=["My Work / Requests"])


def get_requests_service(session: Annotated[Any, Depends(get_db_session)]) -> MyWorkRequestsService:
    return MyWorkRequestsService(session)


ServiceDep = Any  # Annotated[MyWorkRequestsService, Depends(get_requests_service)]


@router.get("", response_model=RequestListResponse)
async def list_my_requests(
    service: ServiceDep,
    employment_id: Annotated[Optional[int], Query()] = None,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> RequestListResponse:
    return await service.list_my_requests(
        employment_id=employment_id,
        status=status,
        search=search,
        limit=20,
    )