"""Document HTTP routes under /projects."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import DocumentLinkType
from app.modules.project.dependencies import DocumentServiceDep
from app.modules.project.document.schemas import (
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
)

router = APIRouter(tags=["Documents"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post(
    "/document-types",
    response_model=DocumentTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document_type(
    body: DocumentTypeCreate,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> DocumentTypeResponse:
    return await service.create_type(body, actor_employment_id=actor)


@router.get("/document-types", response_model=list[DocumentTypeResponse])
async def list_document_types(
    service: DocumentServiceDep,
    include_archived: bool = Query(False),
) -> list[DocumentTypeResponse]:
    return await service.list_types(include_archived=include_archived)


@router.patch("/document-types/{type_id}", response_model=DocumentTypeResponse)
async def update_document_type(
    type_id: int,
    body: DocumentTypeUpdate,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> DocumentTypeResponse:
    return await service.update_type(type_id, body, actor_employment_id=actor)


@router.post("/document-types/{type_id}/archive", response_model=MessageResponse)
async def archive_document_type(
    type_id: int,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_type(type_id, actor_employment_id=actor)


@router.post(
    "/documents",
    response_model=DocumentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    body: DocumentCreate,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> DocumentDetailResponse:
    return await service.create(body, actor_employment_id=actor)


@router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: int, service: DocumentServiceDep
) -> DocumentDetailResponse:
    return await service.get(document_id)


@router.post(
    "/documents/{document_id}/versions",
    response_model=DocumentVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_version(
    document_id: int,
    body: DocumentVersionCreate,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> DocumentVersionResponse:
    return await service.add_version(document_id, body, actor_employment_id=actor)


@router.post("/documents/{document_id}/archive", response_model=MessageResponse)
async def archive_document(
    document_id: int,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive(document_id, actor_employment_id=actor)


@router.post(
    "/links",
    response_model=DocumentLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def link_document(
    body: DocumentLinkCreate,
    service: DocumentServiceDep,
    actor: ActorHeader = None,
) -> DocumentLinkResponse:
    return await service.link(body, actor_employment_id=actor)


@router.get("/links/by-entity", response_model=list[DocumentLinkResponse])
async def list_links_for_entity(
    service: DocumentServiceDep,
    entity_type: DocumentLinkType = Query(...),
    entity_id: int = Query(...),
) -> list[DocumentLinkResponse]:
    return await service.list_links_for_entity(entity_type, entity_id)


@router.get(
    "/documents/{document_id}/links",
    response_model=list[DocumentLinkResponse],
)
async def list_links_for_document(
    document_id: int, service: DocumentServiceDep
) -> list[DocumentLinkResponse]:
    return await service.list_links_for_document(document_id)
