"""Note HTTP routes under /projects."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import NoteReferenceType
from app.modules.project.dependencies import NoteServiceDep
from app.modules.project.note.schemas import NoteCreate, NoteResponse, NoteUpdate

router = APIRouter(tags=["Notes"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreate, service: NoteServiceDep, actor: ActorHeader = None
) -> NoteResponse:
    return await service.create(body, actor_employment_id=actor)


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    service: NoteServiceDep,
    reference_type: NoteReferenceType = Query(...),
    reference_id: int = Query(...),
) -> list[NoteResponse]:
    return await service.list(reference_type, reference_id)


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, service: NoteServiceDep) -> NoteResponse:
    return await service.get(note_id)


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    body: NoteUpdate,
    service: NoteServiceDep,
    actor: ActorHeader = None,
) -> NoteResponse:
    return await service.update(note_id, body, actor_employment_id=actor)
