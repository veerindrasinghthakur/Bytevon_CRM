"""My Work Tasks routes."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.database import get_db_session
from app.modules.my_work.tasks.schemas import MyTaskListResponse
from app.modules.my_work.tasks.service import MyWorkTasksService

router = APIRouter(prefix="/my-work/tasks", tags=["My Work / Tasks"])


def get_tasks_service(session: Annotated[Any, Depends(get_db_session)]) -> MyWorkTasksService:
    return MyWorkTasksService(session)


ServiceDep = Any  # Annotated[MyWorkTasksService, Depends(get_tasks_service)]


@router.get("", response_model=MyTaskListResponse)
async def list_my_tasks(
    service: ServiceDep,
    employment_id: Annotated[Optional[int], Query()] = None,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> MyTaskListResponse:
    return await service.list_my_tasks(
        employment_id=employment_id,
        status=status,
        search=search,
        limit=pageSize,
        offset=page,
    )