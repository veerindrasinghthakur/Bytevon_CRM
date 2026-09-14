"""Lead domain routes."""
from __future__ import annotations
from typing import Annotated, Optional, Union
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.core.db.enums import LeadStatus
from app.modules.sales.domains.lead.schemas import (
    LeadCreate, LeadResponse, LeadStatusChange, LeadUpdate, LeadWonResponse,
)
from app.modules.sales.domains.lead.service import LeadService

router = APIRouter(tags=["Sales / Leads"])
ActorHeader = Annotated[Optional[int], Header(alias="X-Employment-Id")]

def get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> LeadService:
    return LeadService(session)

ServiceDep = Annotated[LeadService, Depends(get_service)]

@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(body: LeadCreate, service: ServiceDep, actor: ActorHeader = None) -> LeadResponse:
    return await service.create(body, actor_employment_id=actor)

@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    service: ServiceDep,
    status_filter: Optional[LeadStatus] = Query(None, alias="status"),
    assigned_employment_id: Optional[int] = Query(None),
    limit: int = Query(500, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[LeadResponse]:
    return await service.list(
        status=status_filter, assigned_employment_id=assigned_employment_id, limit=limit, offset=offset
    )

@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, service: ServiceDep) -> LeadResponse:
    return await service.get(lead_id)

@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: int, body: LeadUpdate, service: ServiceDep, actor: ActorHeader = None) -> LeadResponse:
    return await service.update(lead_id, body, actor_employment_id=actor)

@router.post("/leads/{lead_id}/status", response_model=Union[LeadResponse, LeadWonResponse])
async def change_lead_status(
    lead_id: int, body: LeadStatusChange, service: ServiceDep, actor: ActorHeader = None
) -> Union[LeadResponse, LeadWonResponse]:
    return await service.change_status(lead_id, body, actor_employment_id=actor)
