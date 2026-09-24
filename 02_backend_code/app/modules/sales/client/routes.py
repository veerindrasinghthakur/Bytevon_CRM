"""Client routes — prefix /clients (+ contacts)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.authorization import AuthContext, require_permission
from app.modules.sales.client.schemas import (
    ClientContactCreate,
    ClientContactResponse,
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    MessageResponse,
)
from app.modules.sales.dependencies import ClientServiceDep

router = APIRouter(prefix="/clients", tags=["Sales Clients"])


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    service: ClientServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "CREATE", "ORGANIZATION"))],
) -> ClientResponse:
    return await service.create(body, actor_employment_id=auth.employment_id)


@router.get("", response_model=list[ClientResponse], dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def list_clients(
    service: ClientServiceDep,
    include_archived: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ClientResponse]:
    return await service.list(include_archived=include_archived, limit=limit, offset=offset)


@router.get("/{client_id}", response_model=ClientResponse, dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def get_client(client_id: int, service: ClientServiceDep) -> ClientResponse:
    return await service.get(client_id)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    body: ClientUpdate,
    service: ClientServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "UPDATE", "ORGANIZATION"))],
) -> ClientResponse:
    return await service.update(client_id, body, actor_employment_id=auth.employment_id)


@router.post("/{client_id}/archive", response_model=MessageResponse)
async def archive_client(
    client_id: int,
    service: ClientServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "UPDATE", "ORGANIZATION"))],
) -> MessageResponse:
    return await service.archive(client_id, actor_employment_id=auth.employment_id)


@router.get("/{client_id}/contacts", response_model=list[ClientContactResponse], dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def list_contacts(client_id: int, service: ClientServiceDep) -> list[ClientContactResponse]:
    return await service.list_contacts(client_id)


@router.post(
    "/{client_id}/contacts",
    response_model=ClientContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_contact(
    client_id: int,
    body: ClientContactCreate,
    service: ClientServiceDep,
    auth: Annotated[AuthContext, Depends(require_permission("client", "CREATE", "ORGANIZATION"))],
) -> ClientContactResponse:
    data = body.model_copy(update={"client_id": client_id})
    return await service.add_contact(data, actor_employment_id=auth.employment_id)
