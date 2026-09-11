"""
Sales UI convenience routes — registered BEFORE the main sales router so
paths like /leads/filter-options never hit /leads/{lead_id:int} (422).

Also exposes /sales/meta/* aliases used by the frontend.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Query

from app.core.db.enums import LeadStatus
from app.modules.sales.dependencies import SalesServiceDep

router = APIRouter(prefix="/sales", tags=["Sales"])


def _filter_lead_options(rows: list) -> dict[str, list[str]]:
    statuses = sorted(
        {(r.status.value if hasattr(r.status, "value") else str(r.status)) for r in rows}
    )
    return {
        "statuses": ["Active", "Inactive"] + (statuses or list(LeadStatus.values())),
        "stages": statuses or list(LeadStatus.values()),
        "priorities": ["Critical", "High", "Medium", "Low"],
        "sources": ["LinkedIn", "Website", "Referral", "Direct Referral", "Event", "Other", "Manual"],
    }


@router.get("/meta/lead-filter-options")
@router.get("/leads/filter-options")
async def lead_filter_options(service: SalesServiceDep) -> dict[str, list[str]]:
    rows = await service.list_leads(limit=500)
    return _filter_lead_options(rows)


@router.get("/meta/client-filter-options")
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
    return {
        "items": [],
        "total": 0,
        "page": page,
        "pageSize": pageSize,
        "metrics": [
            {"id": "total", "label": "Case studies", "value": "0", "icon": "menu_book"},
            {"id": "published", "label": "Published", "value": "0", "icon": "check_circle"},
        ],
    }


@router.get("/activities")
async def list_sales_activities(service: SalesServiceDep) -> list[dict[str, Any]]:
    leads = await service.list_leads(limit=20)
    out: list[dict[str, Any]] = []
    for r in leads[:10]:
        st = r.status.value if hasattr(r.status, "value") else str(r.status)
        out.append(
            {
                "id": f"lead-{r.id}",
                "type": "lead",
                "title": r.lead_title,
                "body": f"Status: {st}",
                "actor": "System",
                "time": r.updated_at.isoformat() if r.updated_at else "",
                "dateGroup": "Recent",
                "text": f"Lead ‘{r.lead_title}’ — {st}",
            }
        )
    return out


@router.get("/metrics/dashboard")
async def sales_dashboard_metrics(service: SalesServiceDep) -> list[dict[str, Any]]:
    leads = await service.list_leads(limit=500)
    clients = await service.list_clients(limit=500)
    won = [
        l
        for l in leads
        if (l.status.value if hasattr(l.status, "value") else str(l.status)) == "WON"
    ]
    return [
        {"id": "leads", "label": "Total leads", "value": str(len(leads)), "icon": "trending_up"},
        {"id": "won", "label": "Won", "value": str(len(won)), "icon": "emoji_events"},
        {"id": "clients", "label": "Clients", "value": str(len(clients)), "icon": "business"},
        {
            "id": "pipeline",
            "label": "Open pipeline",
            "value": str(len(leads) - len(won)),
            "icon": "account_tree",
        },
    ]


@router.get("/sales-representatives")
async def list_sales_reps(service: SalesServiceDep) -> dict[str, Any]:
    leads = await service.list_leads(limit=500)
    ids = sorted(
        {l.assigned_employment_id for l in leads if l.assigned_employment_id is not None}
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
