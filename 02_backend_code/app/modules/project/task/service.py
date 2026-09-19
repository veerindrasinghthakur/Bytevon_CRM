"""TaskService — task CRUD and time entries."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.enums import TaskStatus
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.project.project.repository import ProjectRepository
from app.modules.project.task.models import Task, TaskTimeEntry
from app.modules.project.task.repository import TaskRepository
from app.modules.project.task.schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    TimeEntryCreate,
    TimeEntryResponse,
)

logger = logging.getLogger(__name__)


class TaskService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = TaskRepository(session)
        self._project_repo = ProjectRepository(session)

    async def _task_response(self, task: Task) -> TaskResponse:
        await self._session.refresh(task)
        minutes = await self._repo.sum_task_minutes(task.id)
        project_name = None
        try:
            proj = await self._project_repo.get_project_by_id(task.project_id)
            if proj is not None:
                project_name = proj.project_name
        except Exception:
            pass
        base = TaskResponse.model_validate(task)
        return base.model_copy(
            update={"actual_minutes": minutes, "project_name": project_name}
        )

    async def create_task(
        self,
        data: TaskCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> TaskResponse:
        project = await self._project_repo.get_project_by_id(data.project_id)
        if project is None:
            raise NotFoundError("Project not found")
        task = Task(
            **data.model_dump(),
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(task)
        await self._commit()
        await self._audit("task.created", task.id, actor_employment_id)
        return await self._task_response(task)

    async def get_task(self, task_id: int) -> TaskResponse:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        return await self._task_response(task)

    async def list_tasks(self, project_id: int) -> list[TaskResponse]:
        project = await self._project_repo.get_project_by_id(project_id)
        if project is None:
            raise NotFoundError("Project not found")
        rows = await self._repo.list_tasks(project_id)
        return [await self._task_response(t) for t in rows]

    async def list_all_tasks(
        self,
        *,
        project_id: int | None = None,
        project_name: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> list[TaskResponse]:
        resolved_ids = None
        if project_id is not None:
            project = await self._project_repo.get_project_by_id(project_id)
            if project is None:
                raise NotFoundError("Project not found")
        elif project_name and project_name.strip():
            resolved_ids = list(
                await self._project_repo.find_project_ids_by_name(project_name)
            )
            if not resolved_ids:
                return []

        rows = await self._repo.list_all_tasks(
            project_id=project_id,
            project_ids=resolved_ids,
            limit=limit,
            offset=offset,
        )
        return [await self._task_response(t) for t in rows]

    async def update_task(
        self,
        task_id: int,
        data: TaskUpdate,
        *,
        actor_employment_id: int | None = None,
    ) -> TaskResponse:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        payload = data.model_dump(exclude_unset=True)
        new_status = payload.get("status")
        for field, value in payload.items():
            setattr(task, field, value)
        if new_status == TaskStatus.COMPLETED and task.completed_at is None:
            task.completed_at = datetime.now(UTC)
        elif new_status and new_status != TaskStatus.COMPLETED:
            task.completed_at = None
        task.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("task.updated", task.id, actor_employment_id)
        return await self._task_response(task)

    async def create_time_entry(
        self,
        data: TimeEntryCreate,
        *,
        actor_employment_id: int,
    ) -> TimeEntryResponse:
        task = await self._repo.get_task_by_id(data.task_id)
        if task is None:
            raise NotFoundError("Task not found")
        if task.assignee_employment_id != actor_employment_id:
            raise DomainError(
                "Only the current task assignee may create time entries"
            )
        existing = await self._repo.get_time_entry(
            data.task_id, actor_employment_id, data.work_date
        )
        if existing:
            raise ConflictError(
                "Time entry already exists for this task, employee, and date"
            )
        entry = TaskTimeEntry(
            task_id=data.task_id,
            employment_id=actor_employment_id,
            work_date=data.work_date,
            duration_minutes=data.duration_minutes,
            description=data.description,
        )
        await self._repo.add(entry)
        await self._commit()
        await self._audit("task_time_entry.created", entry.id, actor_employment_id)
        await self._session.refresh(entry)
        return TimeEntryResponse.model_validate(entry)

    async def list_time_entries(self, task_id: int) -> list[TimeEntryResponse]:
        task = await self._repo.get_task_by_id(task_id)
        if task is None:
            raise NotFoundError("Task not found")
        rows = await self._repo.list_time_entries(task_id)
        return [TimeEntryResponse.model_validate(r) for r in rows]
