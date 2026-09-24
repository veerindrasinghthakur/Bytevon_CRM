"""My Work Tasks routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import AuthContext, require_permission
from app.core.database import get_db_session
from app.modules.my_work.tasks.schemas import (
    MyProjectOption,
    MyTaskCreate,
    MyTaskListResponse,
)
from app.modules.my_work.tasks.service import MyWorkTasksService
from app.modules.project.task.schemas import TaskResponse

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


@router.get("/projects", response_model=list[MyProjectOption])
async def list_my_projects(
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("task", "VIEW", "SELF"))],
) -> list[MyProjectOption]:
    """Active projects assigned to me or to one of my teams."""
    return await service.list_my_projects(auth.employment_id)


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_my_task(
    body: MyTaskCreate,
    service: ServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("task", "CREATE", "SELF"))],
) -> TaskResponse:
    """Self-assign task create — project must be ACTIVE and mine."""
    return await service.create_my_task(body, employment_id=auth.employment_id)
