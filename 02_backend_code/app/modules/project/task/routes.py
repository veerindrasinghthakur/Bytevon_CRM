"""Task domain HTTP routes (mounted under /projects)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.project.dependencies import TaskServiceDep
from app.modules.project.task.schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TimeEntryCreate,
    TimeEntryResponse,
)

router = APIRouter(tags=["Tasks"])


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    body: TaskCreate, service: TaskServiceDep, auth: Annotated[AuthContext, Depends(require_permission("task", "CREATE", "ORGANIZATION"))]
) -> TaskResponse:
    return await service.create_task(body, actor_employment_id=auth.employment_id)


@router.get("/tasks", response_model=list[TaskResponse], dependencies=[Depends(require_permission("task", "VIEW", "ORGANIZATION"))])
async def list_all_tasks(
    service: TaskServiceDep,
    project_id: int | None = Query(None),
    project_name: str | None = Query(
        None, description="Filter tasks by project name (partial, case-insensitive)"
    ),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[TaskResponse]:
    return await service.list_all_tasks(
        project_id=project_id,
        project_name=project_name,
        limit=limit,
        offset=offset,
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse, dependencies=[Depends(require_permission("task", "VIEW", "ORGANIZATION"))])
async def get_task(task_id: int, service: TaskServiceDep) -> TaskResponse:
    return await service.get_task(task_id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    body: TaskUpdate,
    service: TaskServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("task", "UPDATE", "ORGANIZATION"))],
) -> TaskResponse:
    return await service.update_task(task_id, body, actor_employment_id=auth.employment_id)


@router.post(
    "/time-entries",
    response_model=TimeEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_time_entry(
    body: TimeEntryCreate,
    service: TaskServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("task", "CREATE", "ORGANIZATION"))],
) -> TimeEntryResponse:
    return await service.create_time_entry(body, actor_employment_id=auth.employment_id)


@router.get(
    "/tasks/{task_id}/time-entries",
    response_model=list[TimeEntryResponse],
    dependencies=[Depends(require_permission("task", "VIEW", "ORGANIZATION"))],
)
async def list_time_entries(
    task_id: int, service: TaskServiceDep
) -> list[TimeEntryResponse]:
    return await service.list_time_entries(task_id)


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse], dependencies=[Depends(require_permission("project", "VIEW", "ORGANIZATION"))])
async def list_project_tasks(
    project_id: int, service: TaskServiceDep
) -> list[TaskResponse]:
    return await service.list_tasks(project_id)
