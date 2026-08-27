"""Sales module mock routes."""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Body, Query
from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["sales"])

def _now_iso():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def _now_date():
    return datetime.utcnow().strftime("%Y-%m-%d")

def _paginate(items, page=1, page_size=20):
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 100))
    total = len(items)
    start = (page - 1) * page_size
    return {"items": items[start:start+page_size], "total": total, "page": page, "pageSize": page_size}

def _lead_metrics(items):
    total = len(items)
    active = sum(1 for x in items if x.get("status") == "Active")
    qualified = sum(1 for x in items if x.get("stage") in ("Qualified", "Proposal", "Negotiation", "Won"))
    pipeline = sum(float(x.get("budget") or 0) for x in items if x.get("status") == "Active")
    return [
        {"id": "total-leads", "label": "Total Leads", "value": str(total), "icon": "person_add"},
        {"id": "active", "label": "Active", "value": str(active), "icon": "bolt"},
        {"id": "qualified", "label": "Qualified+", "value": str(qualified), "icon": "verified"},
        {"id": "pipeline", "label": "Pipeline Value", "value": f"${pipeline:,.0f}", "icon": "monetization_on"},
    ]

def _client_metrics(items):
    total = len(items)
    active = sum(1 for x in items if x.get("status") == "Active")
    return [
        {"id": "total-clients", "label": "Total Clients", "value": str(total), "icon": "groups"},
        {"id": "active", "label": "Active Accounts", "value": str(active), "icon": "verified"},
        {"id": "enterprise", "label": "Enterprise", "value": str(sum(1 for x in items if x.get("type") == "Enterprise")), "icon": "apartment"},
        {"id": "smb", "label": "SMB", "value": str(sum(1 for x in items if x.get("type") == "SMB")), "icon": "store"},
    ]

@router.get("/sales/leads/filter-options")
def lead_filter_options():
    leads = get_collection("leads")
    stages = sorted({str(x.get("stage")) for x in leads if x.get("stage")})
    priorities = sorted({str(x.get("priority")) for x in leads if x.get("priority")})
    sources = sorted({str(x.get("source")) for x in leads if x.get("source")})
    statuses = sorted({str(x.get("status")) for x in leads if x.get("status")})
    for s in ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]:
        if s not in stages: stages.append(s)
    for p in ["Critical", "High", "Medium", "Low"]:
        if p not in priorities: priorities.append(p)
    for s in ["LinkedIn", "Website", "Referral", "Direct Referral", "Event", "Other", "Manual"]:
        if s not in sources: sources.append(s)
    for s in ["Active", "Inactive"]:
        if s not in statuses: statuses.append(s)
    return {"statuses": statuses, "stages": stages, "priorities": priorities, "sources": sources}

@router.get("/sales/clients/filter-options")
def client_filter_options():
    clients = get_collection("clients")
    statuses = sorted({str(x.get("status")) for x in clients if x.get("status")}) or ["Active", "Inactive"]
    types = sorted({str(x.get("type")) for x in clients if x.get("type")}) or ["Enterprise", "SMB", "Partner"]
    industries = sorted({str(x.get("industry")) for x in clients if x.get("industry")})
    countries = sorted({str(x.get("country")) for x in clients if x.get("country")})
    for s in ["Active", "Inactive"]:
        if s not in statuses: statuses.append(s)
    for t in ["Enterprise", "SMB", "Partner"]:
        if t not in types: types.append(t)
    return {"statuses": statuses, "types": types, "industries": industries, "countries": countries}

@router.get("/sales/case-studies/filter-options")
def case_study_filter_options():
    rows = get_collection("case_studies")
    statuses = sorted({str(x.get("status")) for x in rows if x.get("status")}) or ["Published", "Draft", "Archived"]
    industries = sorted({str(x.get("industry")) for x in rows if x.get("industry")})
    return {"statuses": statuses, "industries": industries}

@router.get("/sales/sales-representatives")
def list_sales_representatives():
    fallback = get_obj("sales_reps_fallback") or []
    if fallback:
        return {"items": list(fallback), "total": len(fallback)}
    names = sorted({str(l.get("assignedTo")) for l in get_collection("leads") if l.get("assignedTo")})
    out = [{"employmentId": i+1, "name": n, "employeeCode": f"SALES-{i+1}", "department": "Sales"} for i, n in enumerate(names)]
    return {"items": out, "total": len(out)}

@router.get("/sales/leads")
def list_leads(search: Optional[str]=None, status: Optional[str]=None, stage: Optional[str]=None, priority: Optional[str]=None, source: Optional[str]=None, page: Optional[int]=Query(default=None), pageSize: Optional[int]=Query(default=None)):
    items = list(get_collection("leads"))
    if search:
        q = search.lower()
        items = [x for x in items if q in str(x.get("contactName") or "").lower() or q in str(x.get("title") or "").lower() or q in str(x.get("id") or "").lower() or q in str(x.get("company") or "").lower()]
    if status and status != "All": items = [x for x in items if x.get("status") == status]
    if stage and stage != "All": items = [x for x in items if x.get("stage") == stage]
    if priority and priority != "All": items = [x for x in items if x.get("priority") == priority]
    if source and source != "All": items = [x for x in items if x.get("source") == source]
    metrics = _lead_metrics(get_collection("leads"))
    if page is not None or pageSize is not None:
        return {**_paginate(items, page or 1, pageSize or 20), "metrics": metrics}
    return {"items": items, "total": len(items), "metrics": metrics}

@router.get("/sales/leads/{lead_id}")
def get_lead(lead_id: str):
    row = next((x for x in get_collection("leads") if str(x.get("id")) == str(lead_id)), None)
    return row or {"detail": "not found"}

@router.post("/sales/leads")
def create_lead(body: dict[str, Any] = Body(default={})):
    leads = get_collection("leads")
    nums = []
    for x in leads:
        sid = str(x.get("id") or "")
        if sid.startswith("LD-"):
            try: nums.append(int(sid[3:]))
            except ValueError: pass
    nid = f"LD-{(max(nums)+1) if nums else 1000}"
    row = {"id": nid, "title": body.get("title") or "Untitled", "company": body.get("company") or "", "contactName": body.get("contactName") or "", "contactTitle": body.get("contactTitle"), "industry": body.get("industry"), "email": body.get("email"), "phone": body.get("phone"), "source": body.get("source") or "Manual", "priority": body.get("priority") or "Medium", "status": body.get("status") or "Active", "stage": body.get("stage") or "New", "budget": body.get("budget") or 0, "createdAt": _now_date(), "date": body.get("date") or _now_date(), "assignedTo": body.get("assignedTo"), "assignedEmploymentId": body.get("assignedEmploymentId"), "notes": body.get("notes"), "chatLink": body.get("chatLink"), "tags": body.get("tags") or []}
    leads.insert(0, row)
    set_collection("leads", leads)
    return row

@router.patch("/sales/leads/{lead_id}")
@router.put("/sales/leads/{lead_id}")
def update_lead(lead_id: str, body: dict[str, Any] = Body(default={})):
    leads = get_collection("leads")
    row = next((x for x in leads if str(x.get("id")) == str(lead_id)), None)
    if not row: return {"detail": "not found"}
    for k, v in body.items():
        if k != "id": row[k] = v
    set_collection("leads", leads)
    return row

@router.get("/sales/clients")
def list_clients(search: Optional[str]=None, status: Optional[str]=None, type: Optional[str]=None, page: Optional[int]=Query(default=None), pageSize: Optional[int]=Query(default=None)):
    items = list(get_collection("clients"))
    if search:
        q = search.lower()
        items = [x for x in items if q in str(x.get("name") or "").lower() or q in str(x.get("industry") or "").lower() or q in str(x.get("primaryContact") or "").lower() or q in str(x.get("id") or "").lower()]
    if status and status != "All": items = [x for x in items if x.get("status") == status]
    if type and type != "All": items = [x for x in items if x.get("type") == type]
    metrics = _client_metrics(get_collection("clients"))
    if page is not None or pageSize is not None:
        return {**_paginate(items, page or 1, pageSize or 20), "metrics": metrics}
    return {"items": items, "total": len(items), "metrics": metrics}

@router.get("/sales/clients/{client_id}")
def get_client(client_id: str):
    row = next((x for x in get_collection("clients") if str(x.get("id")) == str(client_id)), None)
    return row or {"detail": "not found"}

@router.post("/sales/clients")
def create_client(body: dict[str, Any] = Body(default={})):
    clients = get_collection("clients")
    name = body.get("name") or "New Client"
    cid = f"c{len(clients)+1}"
    row = {"id": cid, "name": name, "legalName": body.get("legalName"), "type": body.get("type") or "SMB", "status": body.get("status") or "Active", "industry": body.get("industry") or "—", "website": body.get("website"), "country": body.get("country") or "—", "address": body.get("address"), "taxId": body.get("taxId"), "founded": body.get("founded"), "chatLink": body.get("chatLink"), "primaryContact": body.get("primaryContact"), "email": body.get("email"), "phone": body.get("phone"), "projects": 0, "leads": 0, "logoInitials": name[:2].upper(), "clientSince": _now_date()}
    clients.insert(0, row)
    set_collection("clients", clients)
    return row

@router.patch("/sales/clients/{client_id}")
@router.put("/sales/clients/{client_id}")
def update_client(client_id: str, body: dict[str, Any] = Body(default={})):
    clients = get_collection("clients")
    row = next((x for x in clients if str(x.get("id")) == str(client_id)), None)
    if not row: return {"detail": "not found"}
    for k, v in body.items():
        if k != "id": row[k] = v
    set_collection("clients", clients)
    return row

@router.get("/sales/case-studies")
def list_case_studies():
    items = get_collection("case_studies")
    published = sum(1 for x in items if x.get("status") == "Published")
    draft = sum(1 for x in items if x.get("status") == "Draft")
    metrics = [
        {"id": "total", "label": "Total Case Studies", "value": str(len(items)), "icon": "library_books"},
        {"id": "published", "label": "Published", "value": str(published), "icon": "check_circle"},
        {"id": "draft", "label": "Draft", "value": str(draft), "icon": "edit_note"},
    ]
    return {"items": items, "metrics": metrics}

@router.get("/sales/activities")
def list_activities():
    return get_collection("sales_activities")

@router.get("/sales/metrics/dashboard")
def metrics_dashboard():
    leads = get_collection("leads")
    clients = get_collection("clients")
    won = sum(1 for x in leads if x.get("stage") == "Won")
    pipeline = sum(float(x.get("budget") or 0) for x in leads if x.get("status") == "Active")
    return [
        {"id": "total-leads", "label": "Total Leads", "value": str(len(leads)), "icon": "person_add"},
        {"id": "won", "label": "Won Leads", "value": str(won), "icon": "emoji_events"},
        {"id": "active-clients", "label": "Active Clients", "value": str(sum(1 for c in clients if c.get("status") == "Active")), "icon": "groups"},
        {"id": "revenue", "label": "Est. Pipeline", "value": f"${pipeline:,.0f}", "icon": "trending_up"},
    ]

@router.get("/sales/metrics/leads")
def metrics_leads():
    return _lead_metrics(get_collection("leads"))

@router.get("/sales/metrics/clients")
def metrics_clients():
    return _client_metrics(get_collection("clients"))
