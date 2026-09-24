"""My Work Tasks Service."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import ProjectAssignmentType, ProjectStatus
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.tasks.repository import MyWorkTasksRepository
from app.modules.my_work.tasks.schemas import (
    MyProjectOption,
    MyTask,
    MyTaskCreate,
    MyTaskListResponse,
)
from app.modules.project.task.schemas import TaskCreate, TaskResponse


class MyWorkTasksService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkTasksRepository(session)

    async def list_my_tasks(
        self,
        employment_id: int | None = None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 1,
    ) -> MyTaskListResponse:
        page = max(1, offset)
        page_size = max(1, limit)
        rows = await self._repo.list_my_tasks(
            employment_id,
            status=status,
            search=search,
            limit=page_size,
            offset=(page - 1) * page_size,
        )
        total = await self._repo.count_my_tasks(
            employment_id, status=status, search=search
        )
        items: list[MyTask] = []
        for task, project_name in rows:
            priority = task.priority.value if hasattr(task.priority, "value") else str(task.priority or "")
            state = task.status.value if hasattr(task.status, "value") else str(task.status or "")
            items.append(
                MyTask(
                    id=str(task.id),
                    name=task.title,
                    project=project_name,
                    priority=priority,
                    status=state,
                    due_date=task.due_date,
                    estimated_hours=task.estimated_hours,
                    created_at=task.created_at,
                )
            )
        return MyTaskListResponse(items=items, total=total, page=page, pageSize=page_size)

    async def list_my_projects(
        self, employment_id: int | None
    ) -> list[MyProjectOption]:
        """Active projects where I am the assignee or on the assigned team."""
        if employment_id is None:
            return []
        rows = await self._repo.list_my_projects(employment_id)
        return [
            MyProjectOption(
                id=r.id,
                name=r.project_name,
                status=r.status.value if hasattr(r.status, "value") else str(r.status),
            )
            for r in rows
        ]

    async def create_my_task(
        self, data: MyTaskCreate, *, employment_id: int
    ) -> TaskResponse:
        """Self-assign create: project must be ACTIVE and mine."""
        from app.modules.project.task.service import TaskService as ProjectTaskService

        allowed = {p.id for p in await self.list_my_projects(employment_id)}
        if data.project_id not in allowed:
            # Distinguish unknown/archived from forbidden for clear errors.
            project = await self._repo.get_project(data.project_id)
            if project is None:
                raise NotFoundError("Project not found")
            status = project.status.value if hasattr(project.status, "value") else str(project.status)
            if status != ProjectStatus.ACTIVE.value:
                raise DomainError("Tasks can only be created in ACTIVE projects")
            raise DomainError("You are not on this project's team")
        service = ProjectTaskService(self._session)
        return await service.create_task(
            TaskCreate(
                project_id=data.project_id,
                title=data.title,
                description=data.description,
                assignee_employment_id=employment_id,
                priority=data.priority,
                start_date=data.start_date,
                due_date=data.due_date,
                estimated_hours=data.estimated_hours,
            ),
            actor_employment_id=employment_id,
        )
