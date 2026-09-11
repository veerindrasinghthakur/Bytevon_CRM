"""
Sales HTTP routes.

Static paths (/leads/filter-options, /case-studies, …) MUST be declared
before /leads/{lead_id} or FastAPI parses "filter-options" as int → 422.
"""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Annotated, Any, Optional, Union

from fastapi import APIRouter, Body, Header, Query, status
from pydantic import BaseModel, ConfigDict, Field

from app.core.db.enums import ClientType, LeadStatus
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


class LeadCreateBody(BaseModel):
    """Accept domain LeadCreate fields OR frontend CreateLeadInput aliases."""

    model_config = ConfigDict(extra="ignore")

    # Domain
    lead_title: Optional[str] = None
    platform_id: Optional[int] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    quotation: Optional[Decimal] = None
    expected_close_date: Optional[str] = None
    assigned_employment_id: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[int] = None
    auto_create_project: bool = True
    client_type: Optional[str] = None
    client_name: Optional[str] = None
    # Frontend aliases
    title: Optional[str] = None
    contactName: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    budget: Optional[Union[Decimal, float, int, str]] = None
    assignedTo: Optional[str] = None
    assignedEmploymentId: Optional[int] = None
    source: Optional[str] = None
    priority: Optional[str] = None
    stage: Optional[str] = None

    def to_domain(self) -> LeadCreate:
        title = (self.lead_title or self.title or "").strip() or "Untitled lead"
        contact = (self.contact_name or self.contactName or "").strip() or title
        quotation = self.quotation
        if quotation is None and self.budget is not None:
            try:
                quotation = Decimal(str(self.budget))
            except (InvalidOperation, ValueError):
                quotation = None
        status_raw = (self.status or self.stage or "NEW").upper().replace(" ", "_")
        # Map common UI stages → domain enum
        stage_map = {
            "ACTIVE": LeadStatus.NEW,
            "NEW": LeadStatus.NEW,
            "CONTACTED": LeadStatus.CHAT_OPEN,
            "QUALIFIED": LeadStatus.MEETING,
            "PROPOSAL": LeadStatus.PROPOSAL_SENT,
            "NEGOTIATION": LeadStatus.PAYMENT_DISCUSSION,
            "WON": LeadStatus.WON,
            "LOST": LeadStatus.LOST,
            "INACTIVE": LeadStatus.CLOSED,
        }
        try:
            status = LeadStatus(status_raw) if status_raw in LeadStatus.values() else stage_map.get(
                status_raw, LeadStatus.NEW
            )
        except ValueError:
            status = stage_map.get(status_raw, LeadStatus.NEW)

        ct_raw = (self.client_type or "COMPANY").upper()
        try:
            client_type = ClientType(ct_raw)
        except ValueError:
            client_type = ClientType.COMPANY

        assigned = self.assigned_employment_id or self.assignedEmploymentId

        return LeadCreate(
            lead_title=title,
            platform_id=self.platform_id,
            contact_name=contact,
            email=self.email,
            phone=self.phone,
            quotation=quotation,
            assigned_employment_id=assigned,
            status=status,
            description=self.description or self.notes,
            client_id=self.client_id,
            auto_create_project=self.auto_create_project,
            client_type=client_type,
            client_name=self.client_name or self.company or contact,
        )


class ClientCreateBody(BaseModel):
    model_config = ConfigDict(extra="ignore")

    client_type: Optional[str] = None
    client_name: Optional[str] = None
    name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = None

    def to_domain(self) -> ClientCreate:
        name = (self.client_name or self.name or "").strip() or "Unnamed client"
        raw = (self.client_type or self.type or "COMPANY").upper()
        if raw in ("SMB", "ENTERPRISE", "PARTNER"):
            raw = "COMPANY"
        try:
            ct = ClientType(raw)
        except ValueError:
            ct = ClientType.COMPANY
        return ClientCreate(
            client_type=ct,
            client_name=name,
            website=self.website,
            industry=self.industry,
            country=self.country,
            state=self.state,
            city=self.city,
            address=self.address,
        )


def _lead_ui(r: LeadResponse) -> dict[str, Any]:
    st = r.status.value if hasattr(r.status, "value") else str(r.status)
    return {
        "id": str(r.id),
        "title": r.lead_title,
        "lead_title": r.lead_title,
        "company": r.client_id and f"Client #{r.client_id}" or "—",
        "contactName": r.contact_name,
        "contact_name": r.contact_name,
        "contactTitle": "",
        "industry": "—",
        "email": r.email or "",
        "phone": r.phone or "",
        "source": "Manual",
        "priority": "Medium",
        "status": "Active" if st not in ("LOST", "CLOSED") else "Inactive",
        "stage": st,
        "budget": float(r.quotation) if r.quotation is not None else 0,
        "quotation": float(r.quotation) if r.quotation is not None else None,
        "createdAt": r.created_at.isoformat() if r.created_at else "",
        "date": r.created_at.date().isoformat() if r.created_at else "",
        "assignedTo": f"Emp #{r.assigned_employment_id}" if r.assigned_employment_id else "",
        "assigned_employment_id": r.assigned_employment_id,
        "notes": r.description or "",
        "description": r.description,
        "client_id": r.client_id,
        "platform_id": r.platform_id,
        "auto_create_project": r.auto_create_project,
    }


def _client_ui(r: ClientResponse) -> dict[str, Any]:
    ct = r.client_type.value if hasattr(r.client_type, "value") else str(r.client_type)
    return {
        "id": str(r.id),
        "name": r.client_name,
        "client_name": r.client_name,
        "legalName": r.client_name,
        "type": "SMB" if ct == "COMPANY" else "Individual",
        "client_type": ct,
        "status": "Inactive" if r.is_archived else "Active",
        "industry": r.industry or "—",
        "website": r.website or "",
        "country": r.country or "—",
        "address": r.address or "",
        "projects": 0,
        "leads": 0,
        "logoInitials": (r.client_name or "C")[:2].upper(),
        "clientSince": r.created_at.date().isoformat() if r.created_at else "",
        "is_archived": r.is_archived,
    }


# ---------------------------------------------------------------------------
# Static UI convenience routes (BEFORE /{id})
# ---------------------------------------------------------------------------


@router.get("/leads/filter-options")
async def lead_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    rows = await service.list_leads(limit=500)
    statuses = sorted({(r.status.value if hasattr(r.status, "value") else str(r.status)) for r in rows})
    return {
        "statuses": statuses or ["NEW", "WON", "LOST"],
        "stages": statuses or list(LeadStatus.values()),
        "priorities": ["Critical", "High", "Medium", "Low"],
        "sources": ["LinkedIn", "Website", "Referral", "Direct Referral", "Event", "Other", "Manual"],
    }


@router.get("/clients/filter-options")
async def client_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    rows = await service.list_clients(limit=500)
    industries = sorted({(r.industry or "").strip() for r in rows if r.industry})
    countries = sorted({(r.country or "").strip() for r in rows if r.country})
    return {
        "statuses": ["Active", "Inactive"],
        "types": ["Enterprise", "SMB", "Partner", "Individual"],
        "industries": industries or ["Technology", "Finance", "Healthcare"],
        "countries": countries or ["India", "USA", "UK"],
    }


@router.get("/case-studies")
async def list_case_studies(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """Stub — case studies not in domain schema yet."""
    return {
        "items": [],
        "total": 0,
        "page": page,
        "pageSize": pageSize,
        "metrics": [
            {"id": "total", "label": "Case studies", "value": "0"},
            {"id": "published", "label": "Published", "value": "0"},
        ],
    }


@router.get("/activities")
async def list_sales_activities(service: SalesServiceDep) -> list[dict[str, Any]]:
    leads = await service.list_leads(limit=20)
    out: list[dict[str, Any]] = []
    for r in leads[:10]:
        out.append(
            {
                "id": f"lead-{r.id}",
                "text": f"Lead ‘{r.lead_title}’ — {r.status.value if hasattr(r.status, 'value') else r.status}",
                "time": r.updated_at.isoformat() if r.updated_at else "",
                "type": "lead",
            }
        )
    return out


@router.get("/metrics/dashboard")
async def sales_dashboard_metrics(service: SalesServiceDep) -> list[dict[str, Any]]:
    leads = await service.list_leads(limit=500)
    clients = await service.list_clients(limit=500)
    won = [l for l in leads if (l.status.value if hasattr(l.status, "value") else str(l.status)) == "WON"]
    return [
        {"id": "leads", "label": "Total leads", "value": str(len(leads))},
        {"id": "won", "label": "Won", "value": str(len(won))},
        {"id": "clients", "label": "Clients", "value": str(len(clients))},
        {
            "id": "pipeline",
            "label": "Open pipeline",
            "value": str(len(leads) - len(won)),
        },
    ]


@router.get("/sales-representatives")
async def list_sales_reps(service: SalesServiceDep) -> dict[str, Any]:
    leads = await service.list_leads(limit=500)
    ids = sorted(
        {
            l.assigned_employment_id
            for l in leads
            if l.assigned_employment_id is not None
        }
    )
    items = [
        {
            "employmentId": eid,
            "name": f"Employee #{eid}",
            "employeeCode": f"SALES-{eid}",
            "department": "Sales",
        }
        for eid in ids
    ]
    if not items:
        items = [
            {
                "employmentId": 1,
                "name": "Sales Rep #1",
                "employeeCode": "SALES-1",
                "department": "Sales",
            }
        ]
    return {"items": items, "total": len(items)}


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

@router.post(
    "/clients",
    status_code=status.HTTP_201_CREATED,
)
async def create_client(
    body: ClientCreateBody,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> dict[str, Any]:
    created = await service.create_client(body.to_domain(), actor_employment_id=actor)
    return _client_ui(created)


@router.get("/clients")
async def list_clients(
    service: SalesServiceDep,
    include_archived: bool = Query(False),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    limit: int = Query(500, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    rows = await service.list_clients(
        include_archived=include_archived, limit=limit, offset=offset
    )
    items = [_client_ui(r) for r in rows]
    if search:
        q = search.lower()
        items = [
            c
            for c in items
            if q in c["name"].lower()
            or q in (c.get("industry") or "").lower()
            or q in c["id"]
        ]
    if status_filter and status_filter not in ("All", ""):
        items = [c for c in items if c["status"] == status_filter]
    if type and type not in ("All", ""):
        items = [c for c in items if c["type"] == type]
    total = len(items)
    start = (page - 1) * pageSize
    page_items = items[start : start + pageSize]
    return {
        "items": page_items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "metrics": [
            {"id": "total", "label": "Clients", "value": str(total)},
            {
                "id": "active",
                "label": "Active",
                "value": str(sum(1 for c in items if c["status"] == "Active")),
            },
        ],
    }


@router.get("/clients/{client_id}")
async def get_client(
    client_id: int, service: SalesServiceDep
) -> dict[str, Any]:
    return _client_ui(await service.get_client(client_id))


@router.patch("/clients/{client_id}")
async def update_client(
    client_id: int,
    body: ClientUpdate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> dict[str, Any]:
    updated = await service.update_client(client_id, body, actor_employment_id=actor)
    return _client_ui(updated)


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
    status_code=status.HTTP_201_CREATED,
)
async def create_lead(
    body: LeadCreateBody,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> dict[str, Any]:
    created = await service.create_lead(body.to_domain(), actor_employment_id=actor)
    return _lead_ui(created)


@router.get("/leads")
async def list_leads(
    service: SalesServiceDep,
    status_filter: Optional[str] = Query(None, alias="status"),
    stage: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    assigned_employment_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    limit: int = Query(500, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    domain_status: Optional[LeadStatus] = None
    raw = (status_filter or stage or "").upper().replace(" ", "_")
    if raw and raw not in ("ALL", "ACTIVE", "INACTIVE", ""):
        try:
            domain_status = LeadStatus(raw)
        except ValueError:
            domain_status = None
    rows = await service.list_leads(
        status=domain_status,
        assigned_employment_id=assigned_employment_id,
        limit=limit,
        offset=offset,
    )
    items = [_lead_ui(r) for r in rows]
    if search:
        q = search.lower()
        items = [
            l
            for l in items
            if q in l["title"].lower()
            or q in l["contactName"].lower()
            or q in l["id"]
            or q in (l.get("company") or "").lower()
        ]
    if status_filter and status_filter not in ("All", ""):
        items = [l for l in items if l["status"] == status_filter]
    if stage and stage not in ("All", ""):
        items = [l for l in items if stage.upper() in str(l.get("stage", "")).upper()]
    total = len(items)
    start = (page - 1) * pageSize
    page_items = items[start : start + pageSize]
    return {
        "items": page_items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "metrics": [
            {"id": "total", "label": "Leads", "value": str(total)},
            {
                "id": "active",
                "label": "Active",
                "value": str(sum(1 for l in items if l["status"] == "Active")),
            },
        ],
    }


@router.get("/leads/{lead_id}")
async def get_lead(lead_id: int, service: SalesServiceDep) -> dict[str, Any]:
    return _lead_ui(await service.get_lead(lead_id))


@router.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: int,
    body: LeadUpdate,
    service: SalesServiceDep,
    actor: ActorHeader = None,
) -> dict[str, Any]:
    updated = await service.update_lead(lead_id, body, actor_employment_id=actor)
    return _lead_ui(updated)


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
