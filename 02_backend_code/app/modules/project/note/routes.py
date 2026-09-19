"""Note HTTP routes under /projects."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.core.db.enums import NoteReferenceType
from app.modules.project.dependencies import NoteServiceDep
from app.modules.project.note.schemas import NoteCreate, NoteResponse, NoteUpdate

router = APIRouter(tags=["Notes"])


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreate, service: NoteServiceDep, auth: Annotated[AuthContext, Depends(require_permission("note", "CREATE", "ORGANIZATION"))]
) -> NoteResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("/notes", response_model=list[NoteResponse], dependencies=[Depends(require_permission("note", "VIEW", "ORGANIZATION"))])
async def list_notes(
    service: NoteServiceDep,
    reference_type: NoteReferenceType = Query(...),
    reference_id: int = Query(...),
) -> list[NoteResponse]:
    return await service.list(reference_type, reference_id)


@router.get("/notes/{note_id}", response_model=NoteResponse, dependencies=[Depends(require_permission("note", "VIEW", "ORGANIZATION"))])
async def get_note(note_id: int, service: NoteServiceDep) -> NoteResponse:
    return await service.get(note_id)


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    body: NoteUpdate,
    service: NoteServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("note", "UPDATE", "ORGANIZATION"))],
) -> NoteResponse:
    return await service.update(note_id, body, actor_employment_id=auth.employment_id)
