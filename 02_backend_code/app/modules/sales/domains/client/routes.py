"""Client domain routes."""
from __future__ import annotations
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.modules.sales.domains.client.schemas import (
    ClientContactCreate, ClientContactResponse, ClientCreate, ClientResponse, ClientUpdate, MessageResponse,
)
from app.modules.sales.domains.client.service import ClientService

router = APIRouter(tags=["Sales / Clients"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> ClientService:
    return ClientService(session)

ServiceDep = Annotated[ClientService, Depends(get_service)]

@router.post("/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(body: ClientCreate, service: ServiceDep, actor: ActorHeader = None) -> ClientResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("/clients", response_model=list[ClientResponse])
async def list_clients(
    service: ServiceDep,
    include_archived: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ClientResponse]:
    return await service.list(include_archived=include_archived, limit=limit, offset=offset)

@router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, service: ServiceDep) -> ClientResponse:
    return await service.get(client_id)

@router.patch("/clients/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, body: ClientUpdate, service: ServiceDep, actor: ActorHeader = None) -> ClientResponse:
    return await service.update(client_id, body, actor_employment_id=actor)

@router.post("/clients/{client_id}/archive", response_model=MessageResponse)
async def archive_client(client_id: int, service: ServiceDep, actor: ActorHeader = None) -> MessageResponse:
    return await service.archive(client_id, actor_employment_id=actor)

@router.post("/contacts", response_model=ClientContactResponse, status_code=status.HTTP_201_CREATED)
async def add_contact(body: ClientContactCreate, service: ServiceDep, actor: ActorHeader = None) -> ClientContactResponse:
    return await service.add_contact(body, actor_employment_id=actor)

@router.get("/clients/{client_id}/contacts", response_model=list[ClientContactResponse])
async def list_contacts(client_id: int, service: ServiceDep) -> list[ClientContactResponse]:
    return await service.list_contacts(client_id)
