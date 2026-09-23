"""
Sales main router — static UI paths first, then domain API routers.

Static paths (/leads/filter-options, …) MUST be declared before domain
routers that bind /leads/{lead_id} or FastAPI parses the segment as int → 422.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.core.authorization import require_permission
from app.core.db.enums import LeadStatus
from app.modules.sales.activity.routes import router as activity_router
from app.modules.sales.case_study.routes import router as case_study_router
from app.modules.sales.client.routes import router as client_router
from app.modules.sales.dashboard.routes import router as dashboard_router
from app.modules.sales.dependencies import SalesServiceDep
from app.modules.sales.lead.routes import router as lead_router
from app.modules.sales.source.routes import router as source_router

router = APIRouter(prefix="/sales", tags=["Sales"])


def _filter_lead_options(rows: list, *, sources: list[str] | None = None) -> dict[str, list[str]]:
    statuses = sorted(
        {(r.status.value if hasattr(r.status, "value") else str(r.status)) for r in rows}
    )
    return {
        "statuses": ["Active", "Inactive"] + (statuses or list(LeadStatus.values())),
        "stages": statuses or list(LeadStatus.values()),
        "priorities": ["Critical", "High", "Medium", "Low"],
        "sources": sources
        or [
            "LinkedIn",
            "Website",
            "Referral",
            "Direct Referral",
            "Event",
            "Other",
            "Manual",
        ],
    }


@router.get("/meta/lead-filter-options", dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
@router.get("/leads/filter-options", dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def lead_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    rows = await service.list_leads(limit=500)
    try:
        listed = await service.list_sources(include_archived=False)
        items = listed.items if hasattr(listed, "items") else (listed or [])
        live_sources = [s.name for s in items if getattr(s, "name", None)]
    except Exception:
        live_sources = []
    return _filter_lead_options(rows, sources=live_sources or None)


@router.get("/meta/client-filter-options", dependencies=[Depends(require_permission("lead", "VIEW", "ORGANIZATION"))])
async def meta_client_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    return await _client_filter_options(service)


@router.get("/clients/filter-options", dependencies=[Depends(require_permission("client", "VIEW", "ORGANIZATION"))])
async def client_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    return await _client_filter_options(service)


async def _client_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    rows = await service.list_clients(limit=500)
    industries = sorted({(r.industry or "").strip() for r in rows if r.industry})
    countries = sorted({(r.country or "").strip() for r in rows if r.country})
    return {
        "statuses": ["Active", "Inactive"],
        "types": ["Enterprise", "SMB", "Partner", "Individual"],
        "industries": industries or ["Technology", "Finance", "Healthcare"],
        "countries": countries or ["India", "USA", "UK"],
    }


@router.get("/sales-representatives", dependencies=[Depends(require_permission("employment", "VIEW", "ORGANIZATION"))])
async def list_sales_reps(service: SalesServiceDep) -> dict[str, Any]:
    leads = await service.list_leads(limit=500)
    ids = sorted(
        {lead.assigned_employment_id for lead in leads if lead.assigned_employment_id is not None}
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


# Domain routers (CRUD). Static paths above must stay first.
router.include_router(lead_router)
router.include_router(client_router)
router.include_router(source_router)
router.include_router(activity_router)
router.include_router(case_study_router)
router.include_router(dashboard_router)
