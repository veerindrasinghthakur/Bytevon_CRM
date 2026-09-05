"""
Sales HTTP routes.
"""

from __future__ import annotations

from typing import Annotated, Optional, Union

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import LeadStatus
from app.modules.sales.dependencies import SalesServiceDep
from app.modules.sales.schemas.schemas import (
    ClientContactCreate,
    ClientContactResponse,
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    LeadCreate,
    LeadResponse,
    LeadStatusChange,
    LeadUpdate,
    LeadWonResponse,
    MessageResponse,
    PlatformCreate,
    PlatformResponse,
    PlatformUpdate,
)

router = APIRouter(prefix="/sales", tags=["Sales"])

ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

@router.post(
    "/clients",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_client(
    body: ClientCreate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> ClientResponse:
    return await service.create_client(body, actor_employment_id=actor)


@router.get("/clients", response_model=list[ClientResponse])
async def list_clients(
    service: SalesServiceDep,
    include_archived: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ClientResponse]:
    return await service.list_clients(
        include_archived=include_archived, limit=limit, offset=offset
    )


@router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int, service: SalesServiceDep
) -> ClientResponse:
    return await service.get_client(client_id)


@router.patch("/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    body: ClientUpdate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> ClientResponse:
    return await service.update_client(client_id, body, actor_employment_id=actor)


@router.post("/clients/{client_id}/archive", response_model=MessageResponse)
async def archive_client(
    client_id: int,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_client(client_id, actor_employment_id=actor)


@router.post(
    "/contacts",
    response_model=ClientContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_contact(
    body: ClientContactCreate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> ClientContactResponse:
    return await service.add_contact(body, actor_employment_id=actor)


@router.get(
    "/clients/{client_id}/contacts",
    response_model=list[ClientContactResponse],
)
async def list_contacts(
    client_id: int, service: SalesServiceDep
) -> list[ClientContactResponse]:
    return await service.list_contacts(client_id)


# ---------------------------------------------------------------------------
# Platforms
# ---------------------------------------------------------------------------

@router.post(
    "/platforms",
    response_model=PlatformResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_platform(
    body: PlatformCreate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> PlatformResponse:
    return await service.create_platform(body, actor_employment_id=actor)


@router.get("/platforms", response_model=list[PlatformResponse])
async def list_platforms(
    service: SalesServiceDep,
    include_archived: bool = Query(False),
) -> list[PlatformResponse]:
    return await service.list_platforms(include_archived=include_archived)


@router.patch("/platforms/{platform_id}", response_model=PlatformResponse)
async def update_platform(
    platform_id: int,
    body: PlatformUpdate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> PlatformResponse:
    return await service.update_platform(
        platform_id, body, actor_employment_id=actor
    )


@router.post("/platforms/{platform_id}/archive", response_model=MessageResponse)
async def archive_platform(
    platform_id: int,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> MessageResponse:
    return await service.archive_platform(platform_id, actor_employment_id=actor)


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_lead(
    body: LeadCreate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> LeadResponse:
    return await service.create_lead(body, actor_employment_id=actor)


@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    service: SalesServiceDep,
    status_filter: Optional[LeadStatus] = Query(None, alias="status"),
    assigned_employment_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeadResponse]:
    return await service.list_leads(
        status=status_filter,
        assigned_employment_id=assigned_employment_id,
        limit=limit,
        offset=offset,
    )


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, service: SalesServiceDep) -> LeadResponse:
    return await service.get_lead(lead_id)


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    body: LeadUpdate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> LeadResponse:
    return await service.update_lead(lead_id, body, actor_employment_id=actor)


@router.post(
    "/leads/{lead_id}/status",
    response_model=Union[LeadResponse, LeadWonResponse],
)
async def change_lead_status(
    lead_id: int,
    body: LeadStatusChange,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> Union[LeadResponse, LeadWonResponse]:
    return await service.change_lead_status(
        lead_id, body, actor_employment_id=actor
    )
