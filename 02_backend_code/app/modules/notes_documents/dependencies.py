"""FastAPI dependencies for Notes & Documents module."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.notes_documents.service import NotesDocumentsService


def get_notes_documents_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotesDocumentsService:
    return NotesDocumentsService(session)


NotesDocumentsServiceDep = Annotated[
    NotesDocumentsService, Depends(get_notes_documents_service)
]
