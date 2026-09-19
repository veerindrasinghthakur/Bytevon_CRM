"""My Work Tasks routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.my_work.tasks.schemas import MyTaskListResponse
from app.modules.my_work.tasks.service import MyWorkTasksService

router = APIRouter(prefix="/my-work/tasks", tags=["My Work / Tasks"])


def get_tasks_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MyWorkTasksService:
    return MyWorkTasksService(session)


ServiceDep = Annotated[MyWorkTasksService, Depends(get_tasks_service)]


@router.get("", response_model=MyTaskListResponse)
async def list_my_tasks(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("task", "VIEW", "SELF"))],
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> MyTaskListResponse:
    return await service.list_my_tasks(
        employment_id=auth.employment_id,
        status=status_filter,
        search=search,
        limit=pageSize,
        offset=page,
    )
