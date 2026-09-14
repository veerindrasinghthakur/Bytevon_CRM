"""
FastAPI dependencies for Project module (domain services).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.project.domains.project.service import ProjectService
from app.modules.project.domains.task.service import TaskService
from app.modules.project.domains.team.service import TeamService


def get_project_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProjectService:
    return ProjectService(session)


def get_task_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TaskService:
    return TaskService(session)


def get_team_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TeamService:
    return TeamService(session)


ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]
TeamServiceDep = Annotated[TeamService, Depends(get_team_service)]

# Backward-compatible alias used by older call sites
ProjectPublicService = ProjectService
