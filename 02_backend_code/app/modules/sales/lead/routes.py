"""Lead routes — prefix /leads."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Header, Query, status

from app.core.db.enums import LeadStatus
from app.modules.sales.dependencies import LeadServiceDep
from app.modules.sales.lead.schemas import (
    LeadCreate,
    LeadResponse,
    LeadStatusChange,
    LeadUpdate,
    LeadWonResponse,
    MessageResponse,
)

router = APIRouter(prefix="/leads", tags=["Sales Leads"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    service: LeadServiceDep,
    actor: ActorHeader = None,
) -> LeadResponse:
    return await service.create(body, actor_employment_id=actor)


@router.get("", response_model=list[LeadResponse])
async def list_leads(
    service: LeadServiceDep,
    status_filter: Optional[LeadStatus] = Query(None, alias="status"),
    assigned_employment_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeadResponse]:
    return await service.list(
        status=status_filter,
        assigned_employment_id=assigned_employment_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, service: LeadServiceDep) -> LeadResponse:
    return await service.get(lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    body: LeadUpdate,
    service: LeadServiceDep,
    actor: ActorHeader = None,
) -> LeadResponse:
    return await service.update(lead_id, body, actor_employment_id=actor)


@router.post("/{lead_id}/status")
async def change_lead_status(
    lead_id: int,
    body: LeadStatusChange,
    service: LeadServiceDep,
    actor: ActorHeader = None,
):
    return await service.change_status(lead_id, body, actor_employment_id=actor)
