"""
FastAPI dependencies for Notes & Documents module.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.notes_documents.services.public_service import (
    NotesDocumentsPublicService,
)


def get_notes_documents_public_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> NotesDocumentsPublicService:
    return NotesDocumentsPublicService(session)


NotesDocumentsServiceDep = Annotated[
    NotesDocumentsPublicService, Depends(get_notes_documents_public_service)
]
