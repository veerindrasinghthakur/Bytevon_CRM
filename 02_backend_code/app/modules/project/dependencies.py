"""FastAPI dependencies for Project module (domain services)."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.project.document.service import DocumentService
from app.modules.project.note.service import NoteService
from app.modules.project.project.service import ProjectService
from app.modules.project.task.service import TaskService
from app.modules.project.team.service import TeamService


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


def get_note_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> NoteService:
    return NoteService(session)


def get_document_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DocumentService:
    return DocumentService(session)


ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]
TeamServiceDep = Annotated[TeamService, Depends(get_team_service)]
NoteServiceDep = Annotated[NoteService, Depends(get_note_service)]
DocumentServiceDep = Annotated[DocumentService, Depends(get_document_service)]
