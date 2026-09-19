"""Document HTTP routes under /projects."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
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


@router.post(
    "/document-types",
    response_model=DocumentTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document_type(
    body: DocumentTypeCreate,
    service: DocumentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("document", "CREATE", "ORGANIZATION"))],
) -> DocumentTypeResponse:
    return await service.create_type(body, actor_employment_id=auth.employment_id)


@router.get("/document-types", response_model=list[DocumentTypeResponse], dependencies=[Depends(require_permission("document", "VIEW", "ORGANIZATION"))])
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
    auth: Annotated[AuthContext, Depends(require_permission("document", "UPDATE", "ORGANIZATION"))],
) -> DocumentTypeResponse:
    return await service.update_type(type_id, body, actor_employment_id=auth.employment_id)


@router.post("/document-types/{type_id}/archive", response_model=MessageResponse)
async def archive_document_type(
    type_id: int,
    service: DocumentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("document", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.archive_type(type_id, actor_employment_id=auth.employment_id)


@router.post(
    "/documents",
    response_model=DocumentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    body: DocumentCreate,
    service: DocumentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("document", "CREATE", "ORGANIZATION"))],
) -> DocumentDetailResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("/documents/{document_id}", response_model=DocumentDetailResponse, dependencies=[Depends(require_permission("document", "VIEW", "ORGANIZATION"))])
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
    auth: Annotated[AuthContext, Depends(require_permission("document", "CREATE", "ORGANIZATION"))],
) -> DocumentVersionResponse:
    return await service.add_version(document_id, body, actor_employment_id=auth.employment_id)


@router.post("/documents/{document_id}/archive", response_model=MessageResponse)
async def archive_document(
    document_id: int,
    service: DocumentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("document", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.archive(document_id, actor_employment_id=auth.employment_id)


@router.post(
    "/links",
    response_model=DocumentLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def link_document(
    body: DocumentLinkCreate,
    service: DocumentServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("document", "CREATE", "ORGANIZATION"))],
) -> DocumentLinkResponse:
    return await service.link(body, actor_employment_id=auth.employment_id)


@router.get("/links/by-entity", response_model=list[DocumentLinkResponse], dependencies=[Depends(require_permission("document", "VIEW", "ORGANIZATION"))])
async def list_links_for_entity(
    service: DocumentServiceDep,
    entity_type: DocumentLinkType = Query(...),
    entity_id: int = Query(...),
) -> list[DocumentLinkResponse]:
    return await service.list_links_for_entity(entity_type, entity_id)


@router.get(
    "/documents/{document_id}/links",
    response_model=list[DocumentLinkResponse],
    dependencies=[Depends(require_permission("document", "VIEW", "ORGANIZATION"))],
)
async def list_links_for_document(
    document_id: int, service: DocumentServiceDep
) -> list[DocumentLinkResponse]:
    return await service.list_links_for_document(document_id)
