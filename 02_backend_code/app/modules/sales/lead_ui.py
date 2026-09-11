"""Map domain LeadResponse → frontend Lead card/form shape."""

from __future__ import annotations

from typing import Any, Mapping, Optional

from app.core.db.enums import LeadStatus
from app.modules.sales.schemas.schemas import LeadResponse

# Domain LeadStatus → UI pipeline stage labels (LeadCreatePage enums)
_STATUS_TO_STAGE: dict[str, str] = {
    "NEW": "New",
    "CHAT_OPEN": "Contacted",
    "MEETING": "Qualified",
    "PROPOSAL_SENT": "Proposal",
    "EXECUTION_PLAN_SENT": "Proposal",
    "PAYMENT_DISCUSSION": "Negotiation",
    "WON": "Won",
    "LOST": "Lost",
    "FOLLOW_UP": "Contacted",
    "CLOSED": "Lost",
}

_STAGE_TO_STATUS: dict[str, LeadStatus] = {
    "NEW": LeadStatus.NEW,
    "CONTACTED": LeadStatus.CHAT_OPEN,
    "QUALIFIED": LeadStatus.MEETING,
    "PROPOSAL": LeadStatus.PROPOSAL_SENT,
    "NEGOTIATION": LeadStatus.PAYMENT_DISCUSSION,
    "WON": LeadStatus.WON,
    "LOST": LeadStatus.LOST,
    "ACTIVE": LeadStatus.NEW,
    "INACTIVE": LeadStatus.CLOSED,
    "CHAT_OPEN": LeadStatus.CHAT_OPEN,
    "MEETING": LeadStatus.MEETING,
    "PROPOSAL_SENT": LeadStatus.PROPOSAL_SENT,
    "PAYMENT_DISCUSSION": LeadStatus.PAYMENT_DISCUSSION,
    "FOLLOW_UP": LeadStatus.FOLLOW_UP,
    "CLOSED": LeadStatus.CLOSED,
}


def domain_status_value(status: object) -> str:
    return status.value if hasattr(status, "value") else str(status)


def stage_label(status: object) -> str:
    raw = domain_status_value(status).upper()
    return _STATUS_TO_STAGE.get(raw, raw.replace("_", " ").title())


def parse_stage_or_status(raw: Optional[str]) -> Optional[LeadStatus]:
    if not raw:
        return None
    key = raw.strip().upper().replace(" ", "_")
    if key in ("ALL", "ACTIVE", "INACTIVE", ""):
        if key == "INACTIVE":
            return LeadStatus.CLOSED
        return None
    if key in _STAGE_TO_STATUS:
        return _STAGE_TO_STATUS[key]
    try:
        return LeadStatus(key)
    except ValueError:
        return None


def lead_to_ui(
    r: LeadResponse,
    *,
    client_name: Optional[str] = None,
    platform_name: Optional[str] = None,
    assignee_name: Optional[str] = None,
) -> dict[str, Any]:
    st = domain_status_value(r.status)
    company = "—"
    if client_name:
        company = client_name
    elif r.client_id:
        company = f"Client #{r.client_id}"

    priority = (r.priority or "Medium").strip() or "Medium"
    # normalize casing to match frontend enums
    priority_map = {p.lower(): p for p in ("Critical", "High", "Medium", "Low")}
    priority = priority_map.get(priority.lower(), priority)

    close = r.expected_close_date.isoformat() if r.expected_close_date else ""
    created = r.created_at.isoformat() if r.created_at else ""
    created_date = r.created_at.date().isoformat() if r.created_at else ""

    return {
        "id": str(r.id),
        "title": r.lead_title,
        "lead_title": r.lead_title,
        "company": company,
        "contactName": r.contact_name,
        "contact_name": r.contact_name,
        "contactTitle": r.contact_title or "",
        "contact_title": r.contact_title,
        "industry": "—",
        "email": r.email or "",
        "phone": r.phone or "",
        "source": platform_name or "Manual",
        "priority": priority,
        "status": "Inactive" if st in ("LOST", "CLOSED") else "Active",
        "stage": stage_label(r.status),
        "budget": float(r.quotation) if r.quotation is not None else 0,
        "quotation": float(r.quotation) if r.quotation is not None else None,
        "createdAt": created,
        "date": close or created_date,
        "assignedTo": assignee_name
        or (f"Emp #{r.assigned_employment_id}" if r.assigned_employment_id else ""),
        "assigned_employment_id": r.assigned_employment_id,
        "assignedEmploymentId": r.assigned_employment_id,
        "notes": r.description or "",
        "description": r.description,
        "chatLink": r.chat_link or "",
        "chat_link": r.chat_link,
        "client_id": r.client_id,
        "platform_id": r.platform_id,
        "platformId": r.platform_id,
        "auto_create_project": r.auto_create_project,
    }


async def enrich_leads_ui(
    service: Any,
    rows: list[LeadResponse],
) -> list[dict[str, Any]]:
    """Resolve client + platform names for list/detail cards."""
    client_ids = {r.client_id for r in rows if r.client_id}
    platform_ids = {r.platform_id for r in rows if r.platform_id}

    clients: Mapping[int, str] = {}
    if client_ids:
        all_clients = await service.list_clients(include_archived=True, limit=500)
        clients = {c.id: c.client_name for c in all_clients if c.id in client_ids}

    platforms: Mapping[int, str] = {}
    if platform_ids:
        all_platforms = await service.list_platforms(include_archived=True)
        platforms = {p.id: p.name for p in all_platforms if p.id in platform_ids}

    return [
        lead_to_ui(
            r,
            client_name=clients.get(r.client_id) if r.client_id else None,
            platform_name=platforms.get(r.platform_id) if r.platform_id else None,
        )
        for r in rows
    ]
