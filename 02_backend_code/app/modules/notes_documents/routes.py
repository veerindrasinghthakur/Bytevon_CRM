"""Notes & Documents HTTP routes."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import DocumentLinkType, NoteReferenceType
from app.modules.notes_documents.dependencies import NotesDocumentsServiceDep
from app.modules.notes_documents.schemas import (
    DocumentCreate,
    DocumentDetailResponse,
    DocumentLinkCreate,
    DocumentLinkResponse,
    DocumentTypeCreate,
    DocumentTypeResponse,
    DocumentTypeUpdate,
    DocumentVersionCreate,
    DocumentVersionResponse,
    MessageResponse,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
)

router = APIRouter(prefix="/notes-documents", tags=["Notes & Documents"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreate, service: NotesDocumentsServiceDep, actor: ActorHeader = None
) -> NoteResponse:
    return await service.create_note(body, actor_employment_id=actor)


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    service: NotesDocumentsServiceDep,
    reference_type: NoteReferenceType = Query(...),
    reference_id: int = Query(...),
) -> list[NoteResponse]:
    return await service.list_notes(reference_type, reference_id)


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, service: NotesDocumentsServiceDep) -> NoteResponse:
    return await service.get_note(note_id)


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    body: NoteUpdate,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> NoteResponse:
    return await service.update_note(note_id, body, actor_employment_id=actor)


@router.post(
    "/document-types",
    response_model=DocumentTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document_type(
    body: DocumentTypeCreate,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> DocumentTypeResponse:
    return await service.create_document_type(body, actor_employment_id=actor)


@router.get("/document-types", response_model=list[DocumentTypeResponse])
async def list_document_types(
    service: NotesDocumentsServiceDep,
    include_archived: bool = Query(False),
) -> list[DocumentTypeResponse]:
    return await service.list_document_types(include_archived=include_archived)


@router.patch("/document-types/{type_id}", response_model=DocumentTypeResponse)
async def update_document_type(
    type_id: int,
    body: DocumentTypeUpdate,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> DocumentTypeResponse:
    return await service.update_document_type(type_id, body, actor_employment_id=actor)


@router.post("/document-types/{type_id}/archive", response_model=MessageResponse)
async def archive_document_type(
    type_id: int,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_document_type(type_id, actor_employment_id=actor)


@router.post(
    "/documents",
    response_model=DocumentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    body: DocumentCreate,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> DocumentDetailResponse:
    return await service.create_document(body, actor_employment_id=actor)


@router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: int, service: NotesDocumentsServiceDep
) -> DocumentDetailResponse:
    return await service.get_document(document_id)


@router.post(
    "/documents/{document_id}/versions",
    response_model=DocumentVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_version(
    document_id: int,
    body: DocumentVersionCreate,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> DocumentVersionResponse:
    return await service.add_version(document_id, body, actor_employment_id=actor)


@router.post("/documents/{document_id}/archive", response_model=MessageResponse)
async def archive_document(
    document_id: int,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_document(document_id, actor_employment_id=actor)


@router.post(
    "/links",
    response_model=DocumentLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def link_document(
    body: DocumentLinkCreate,
    service: NotesDocumentsServiceDep,
    actor: ActorHeader = None,
) -> DocumentLinkResponse:
    return await service.link_document(body, actor_employment_id=actor)


@router.get("/links/by-entity", response_model=list[DocumentLinkResponse])
async def list_links_for_entity(
    service: NotesDocumentsServiceDep,
    entity_type: DocumentLinkType = Query(...),
    entity_id: int = Query(...),
) -> list[DocumentLinkResponse]:
    return await service.list_links_for_entity(entity_type, entity_id)


@router.get(
    "/documents/{document_id}/links",
    response_model=list[DocumentLinkResponse],
)
async def list_links_for_document(
    document_id: int, service: NotesDocumentsServiceDep
) -> list[DocumentLinkResponse]:
    return await service.list_links_for_document(document_id)
