"""Sales module mock routes — leads, clients, case studies, filter options, sales reps."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["sales"])


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _now_date() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _append_audit(action: str, target: str) -> None:
    audits = get_collection("audit_logs")
    audits.insert(
        0,
        {
            "id": f"AUD-{int(datetime.utcnow().timestamp())}",
            "action": action,
            "actor": "Current User",
            "actorInitials": "CU",
            "target": target,
            "module": "Sales",
            "timestamp": datetime.utcnow().strftime("%b %d, %Y %H:%M"),
            "timestamp_iso": _now_iso(),
            "ip": "127.0.0.1",
        },
    )
    set_collection("audit_logs", audits)


def _ensure_sales() -> None:
    if not get_collection("leads"):
        set_collection(
            "leads",
            [
                {
                    "id": "LD-1024",
                    "title": "TechNexus ERP Migration",
                    "contactName": "Sarah Miller",
                    "contactTitle": "VP of Growth",
                    "company": "TechNexus Corp.",
                    "industry": "SaaS / Technology",
                    "email": "s.miller@technexus.com",
                    "phone": "+1 (555) 012-3456",
                    "source": "LinkedIn",
                    "priority": "Critical",
                    "status": "Active",
                    "stage": "Qualified",
                    "budget": 120000,
                    "probability": 65,
                    "date": "2024-12-15",
                    "assignedTo": "Alex Rivera",
                    "assignedEmploymentId": None,
                    "tags": ["HOT LEAD", "ENTERPRISE"],
                    "createdAt": "2024-10-01",
                    "notes": "Demo focus on multi-entity consolidation.",
                    "chatLink": "https://chat.bytevon.app/c/technexus-sarah",
                },
                {
                    "id": "LD-1025",
                    "title": "Global Logistics Audit",
                    "contactName": "Jordan Lee",
                    "company": "Global Logistics Ltd.",
                    "industry": "Transportation",
                    "source": "Referral",
                    "priority": "Medium",
                    "status": "Active",
                    "stage": "New",
                    "budget": 45000,
                    "date": "2025-01-22",
                    "tags": ["STRATEGIC"],
                    "createdAt": "2024-10-10",
                },
                {
                    "id": "LD-1026",
                    "title": "Chen Fintech Rollout",
                    "contactName": "Robert Chen",
                    "company": "Chen Financial Group",
                    "industry": "Fintech / Banking",
                    "source": "Direct Referral",
                    "priority": "High",
                    "status": "Active",
                    "stage": "Negotiation",
                    "budget": 280000,
                    "createdAt": "2024-09-20",
                },
                {
                    "id": "LD-1027",
                    "title": "Cloud ERP Migration",
                    "contactName": "Jonathan Smith",
                    "company": "Starlight Tech",
                    "email": "j.smith@starlight.com",
                    "source": "LinkedIn",
                    "priority": "High",
                    "status": "Active",
                    "stage": "Negotiation",
                    "budget": 120000,
                    "createdAt": "2024-10-12",
                },
                {
                    "id": "LD-1028",
                    "title": "Mobile POS System",
                    "contactName": "Maria Benson",
                    "company": "Cloud9 Systems",
                    "source": "Website",
                    "priority": "Medium",
                    "status": "Inactive",
                    "stage": "Proposal",
                    "budget": 45000,
                    "createdAt": "2024-10-13",
                },
            ],
        )
    if not get_collection("clients"):
        set_collection(
            "clients",
            [
                {
                    "id": "c1",
                    "name": "NexTech Solutions",
                    "type": "Enterprise",
                    "status": "Active",
                    "industry": "Technology",
                    "country": "United States",
                    "projects": 12,
                    "leads": 4,
                    "logoInitials": "NK",
                },
                {
                    "id": "c2",
                    "name": "CloudScale Inc.",
                    "type": "SMB",
                    "status": "Active",
                    "industry": "Cloud Infrastructure",
                    "country": "Canada",
                    "projects": 3,
                    "leads": 8,
                    "logoInitials": "CS",
                },
                {
                    "id": "c3",
                    "name": "Altair Ventures",
                    "type": "Partner",
                    "status": "Inactive",
                    "industry": "Venture Capital",
                    "country": "Germany",
                    "projects": 0,
                    "leads": 1,
                    "logoInitials": "AV",
                },
                {
                    "id": "c4",
                    "name": "Nexus Global Holdings",
                    "type": "Enterprise",
                    "status": "Active",
                    "industry": "Technology",
                    "country": "United States",
                    "projects": 12,
                    "leads": 4,
                    "logoInitials": "NG",
                },
            ],
        )
    if not get_collection("case_studies"):
        set_collection(
            "case_studies",
            [
                {
                    "id": "cs1",
                    "title": "TechNexus ERP Migration",
                    "customer": "TechNexus Corp",
                    "industry": "SaaS",
                    "status": "Published",
                    "impact": "40% efficiency gain",
                    "revenue": "$1.2M",
                    "tags": ["ERP", "Cloud", "Migration"],
                },
                {
                    "id": "cs2",
                    "title": "Global Logistics Optimization",
                    "customer": "SwiftFlow Ltd",
                    "industry": "Logistics",
                    "status": "Draft",
                    "impact": "15% Cost reduction",
                    "revenue": "$850k",
                    "tags": ["SCM", "AI"],
                },
                {
                    "id": "cs3",
                    "title": "Zenith Bank Digital Core",
                    "customer": "Zenith Group",
                    "industry": "Finance",
                    "status": "Published",
                    "impact": "Zero downtime update",
                    "revenue": "$2.1M",
                    "tags": ["Banking", "Fintech"],
                },
            ],
        )
    if not get_collection("sales_activities"):
        set_collection(
            "sales_activities",
            [
                {
                    "id": "a1",
                    "type": "Lead Created",
                    "title": "Lead Created",
                    "body": "New high-potential lead from APAC summit.",
                    "actor": "Sarah Jenkins",
                    "time": "10:45 AM",
                    "dateGroup": "Today",
                    "tag": "LEAD",
                },
                {
                    "id": "a2",
                    "type": "Lead Won",
                    "title": "Lead Won",
                    "body": "Closed multi-year ERP migration contract.",
                    "actor": "Alex Rivera",
                    "time": "09:12 AM",
                    "dateGroup": "Today",
                    "tag": "CLIENT",
                },
            ],
        )


def _lead_metrics(items: list[dict]) -> list[dict]:
    total = len(items)
    active = sum(1 for x in items if x.get("status") == "Active")
    qualified = sum(1 for x in items if x.get("stage") in ("Qualified", "Proposal", "Negotiation", "Won"))
    pipeline = sum(float(x.get("budget") or 0) for x in items if x.get("status") == "Active")
    return [
        {"id": "total-leads", "label": "Total Leads", "value": str(total), "icon": "person_add"},
        {"id": "active", "label": "Active", "value": str(active), "icon": "bolt"},
        {"id": "qualified", "label": "Qualified+", "value": str(qualified), "icon": "verified"},
        {
            "id": "pipeline",
            "label": "Pipeline Value",
            "value": f"${pipeline:,.0f}",
            "icon": "monetization_on",
        },
    ]


def _client_metrics(items: list[dict]) -> list[dict]:
    total = len(items)
    active = sum(1 for x in items if x.get("status") == "Active")
    return [
        {"id": "total-clients", "label": "Total Clients", "value": str(total), "icon": "groups"},
        {"id": "active", "label": "Active Accounts", "value": str(active), "icon": "verified"},
        {"id": "enterprise", "label": "Enterprise", "value": str(sum(1 for x in items if x.get("type") == "Enterprise")), "icon": "apartment"},
        {"id": "smb", "label": "SMB", "value": str(sum(1 for x in items if x.get("type") == "SMB")), "icon": "store"},
    ]


# ── Filter options ────────────────────────────────────────────────────


@router.get("/sales/leads/filter-options")
def lead_filter_options():
    _ensure_sales()
    leads = get_collection("leads")
    stages = sorted({str(x.get("stage")) for x in leads if x.get("stage")})
    priorities = sorted({str(x.get("priority")) for x in leads if x.get("priority")})
    sources = sorted({str(x.get("source")) for x in leads if x.get("source")})
    statuses = sorted({str(x.get("status")) for x in leads if x.get("status")})
    # Canonical enums always included so empty store still works
    for s in ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]:
        if s not in stages:
            stages.append(s)
    for p in ["Critical", "High", "Medium", "Low"]:
        if p not in priorities:
            priorities.append(p)
    for s in ["LinkedIn", "Website", "Referral", "Direct Referral", "Event", "Other", "Manual"]:
        if s not in sources:
            sources.append(s)
    for s in ["Active", "Inactive"]:
        if s not in statuses:
            statuses.append(s)
    return {
        "statuses": statuses,
        "stages": stages,
        "priorities": priorities,
        "sources": sources,
    }


@router.get("/sales/clients/filter-options")
def client_filter_options():
    _ensure_sales()
    clients = get_collection("clients")
    statuses = sorted({str(x.get("status")) for x in clients if x.get("status")}) or ["Active", "Inactive"]
    types = sorted({str(x.get("type")) for x in clients if x.get("type")}) or ["Enterprise", "SMB", "Partner"]
    industries = sorted({str(x.get("industry")) for x in clients if x.get("industry")})
    countries = sorted({str(x.get("country")) for x in clients if x.get("country")})
    for s in ["Active", "Inactive"]:
        if s not in statuses:
            statuses.append(s)
    for t in ["Enterprise", "SMB", "Partner"]:
        if t not in types:
            types.append(t)
    return {
        "statuses": statuses,
        "types": types,
        "industries": industries,
        "countries": countries,
    }


@router.get("/sales/case-studies/filter-options")
def case_study_filter_options():
    _ensure_sales()
    rows = get_collection("case_studies")
    statuses = sorted({str(x.get("status")) for x in rows if x.get("status")}) or [
        "Published",
        "Draft",
        "Archived",
    ]
    industries = sorted({str(x.get("industry")) for x in rows if x.get("industry")})
    return {"statuses": statuses, "industries": industries}


# ── Sales representatives (Sales department employees) ────────────────


@router.get("/sales/sales-representatives")
def list_sales_representatives():
    """Employees currently assigned to the Sales department."""
    departments = get_collection("departments")
    sales_dept = next(
        (d for d in departments if str(d.get("name") or "").lower() == "sales"),
        None,
    )
    if not sales_dept:
        # fallback synthetic options
        return {
            "items": [
                {"employmentId": 0, "name": "Unassigned", "employeeCode": "—", "department": "Sales"},
            ],
            "total": 0,
        }
    dept_id = sales_dept.get("id")
    assignments = get_collection("employment_assignments")
    persons = {p.get("id"): p for p in get_collection("persons")}
    employments = {e.get("id"): e for e in get_collection("employments")}
    out = []
    seen = set()
    for a in assignments:
        if a.get("department_id") != dept_id:
            continue
        if a.get("effective_to") is not None:
            continue
        eid = a.get("employment_id")
        if eid in seen:
            continue
        seen.add(eid)
        emp = employments.get(eid)
        if not emp or emp.get("status") not in (None, "ACTIVE", "Active"):
            continue
        person = persons.get(emp.get("person_id"))
        name = (
            f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
            if person
            else emp.get("employee_code") or str(eid)
        )
        out.append(
            {
                "employmentId": eid,
                "name": name,
                "employeeCode": emp.get("employee_code") or "—",
                "department": sales_dept.get("name") or "Sales",
            }
        )
    out.sort(key=lambda x: x["name"].lower())
    return {"items": out, "total": len(out)}


# ── Leads ─────────────────────────────────────────────────────────────


@router.get("/sales/leads")
def list_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    priority: Optional[str] = None,
    source: Optional[str] = None,
):
    _ensure_sales()
    items = list(get_collection("leads"))
    if search:
        q = search.lower()
        items = [
            x
            for x in items
            if q in str(x.get("contactName") or "").lower()
            or q in str(x.get("title") or "").lower()
            or q in str(x.get("id") or "").lower()
            or q in str(x.get("company") or "").lower()
        ]
    if status and status != "All":
        items = [x for x in items if x.get("status") == status]
    if stage and stage != "All":
        items = [x for x in items if x.get("stage") == stage]
    if priority and priority != "All":
        items = [x for x in items if x.get("priority") == priority]
    if source and source != "All":
        items = [x for x in items if x.get("source") == source]
    all_leads = get_collection("leads")
    return {"items": items, "total": len(all_leads), "metrics": _lead_metrics(all_leads)}


@router.get("/sales/leads/{lead_id}")
def get_lead(lead_id: str):
    _ensure_sales()
    row = next((x for x in get_collection("leads") if str(x.get("id")) == str(lead_id)), None)
    return row or {"detail": "not found"}


@router.post("/sales/leads")
def create_lead(body: dict[str, Any] = Body(default={})):
    _ensure_sales()
    leads = get_collection("leads")
    counters = get_obj("counters") or {}
    n = counters.get("next_lead") or (1000 + len(leads) + 1)
    counters["next_lead"] = n + 1
    set_obj("counters", counters)
    assigned_name = body.get("assignedTo") or ""
    assigned_emp = body.get("assignedEmploymentId")
    if assigned_emp and not assigned_name:
        # resolve name from persons
        emp = next((e for e in get_collection("employments") if e.get("id") == assigned_emp), None)
        if emp:
            person = next((p for p in get_collection("persons") if p.get("id") == emp.get("person_id")), None)
            if person:
                assigned_name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
    row = {
        "id": body.get("id") or f"LD-{n}",
        "title": body.get("title") or "Untitled lead",
        "contactName": body.get("contactName") or "",
        "contactTitle": body.get("contactTitle") or "",
        "company": body.get("company") or "",
        "industry": body.get("industry") or "",
        "email": body.get("email") or "",
        "phone": body.get("phone") or "",
        "source": body.get("source") or "Manual",
        "priority": body.get("priority") or "Medium",
        "status": body.get("status") or "Active",
        "stage": body.get("stage") or "New",
        "budget": float(body.get("budget") or 0),
        "probability": body.get("probability"),
        "date": body.get("date") or "",
        "assignedTo": assigned_name,
        "assignedEmploymentId": assigned_emp,
        "tags": body.get("tags") or [],
        "createdAt": _now_date(),
        "notes": body.get("notes") or "",
        "chatLink": body.get("chatLink") or "",
    }
    leads.insert(0, row)
    set_collection("leads", leads)
    _append_audit("Lead created", row["title"])
    return row


@router.patch("/sales/leads/{lead_id}")
@router.put("/sales/leads/{lead_id}")
def update_lead(lead_id: str, body: dict[str, Any] = Body(default={})):
    _ensure_sales()
    leads = get_collection("leads")
    row = next((x for x in leads if str(x.get("id")) == str(lead_id)), None)
    if not row:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            row[k] = v
    # resolve assigned name if employment id provided
    if "assignedEmploymentId" in body and body.get("assignedEmploymentId"):
        emp = next(
            (e for e in get_collection("employments") if e.get("id") == body["assignedEmploymentId"]),
            None,
        )
        if emp:
            person = next(
                (p for p in get_collection("persons") if p.get("id") == emp.get("person_id")),
                None,
            )
            if person:
                row["assignedTo"] = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
    set_collection("leads", leads)
    _append_audit("Lead updated", row.get("title") or lead_id)
    return row


# ── Clients ───────────────────────────────────────────────────────────


@router.get("/sales/clients")
def list_clients(
    search: Optional[str] = None,
    status: Optional[str] = None,
    type: Optional[str] = Query(default=None, alias="type"),
):
    _ensure_sales()
    items = list(get_collection("clients"))
    if search:
        q = search.lower()
        items = [
            x
            for x in items
            if q in str(x.get("name") or "").lower()
            or q in str(x.get("industry") or "").lower()
            or q in str(x.get("id") or "").lower()
            or q in str(x.get("primaryContact") or "").lower()
        ]
    if status and status != "All":
        items = [x for x in items if x.get("status") == status]
    if type and type != "All":
        items = [x for x in items if x.get("type") == type]
    all_c = get_collection("clients")
    return {"items": items, "total": len(all_c), "metrics": _client_metrics(all_c)}


@router.get("/sales/clients/{client_id}")
def get_client(client_id: str):
    _ensure_sales()
    row = next((x for x in get_collection("clients") if str(x.get("id")) == str(client_id)), None)
    return row or {"detail": "not found"}


@router.post("/sales/clients")
def create_client(body: dict[str, Any] = Body(default={})):
    _ensure_sales()
    clients = get_collection("clients")
    counters = get_obj("counters") or {}
    n = counters.get("next_client") or (len(clients) + 1)
    counters["next_client"] = n + 1
    set_obj("counters", counters)
    name = body.get("name") or f"Client {n}"
    row = {
        "id": body.get("id") or f"c{n}",
        "name": name,
        "legalName": body.get("legalName") or name,
        "type": body.get("type") or "SMB",
        "status": body.get("status") or "Active",
        "industry": body.get("industry") or "—",
        "country": body.get("country") or "—",
        "email": body.get("email") or "",
        "phone": body.get("phone") or "",
        "primaryContact": body.get("primaryContact") or "",
        "projects": body.get("projects") or 0,
        "leads": body.get("leads") or 0,
        "logoInitials": body.get("logoInitials") or name[:2].upper(),
        "website": body.get("website") or "",
        "chatLink": body.get("chatLink") or "",
    }
    clients.insert(0, row)
    set_collection("clients", clients)
    _append_audit("Client created", name)
    return row


@router.patch("/sales/clients/{client_id}")
@router.put("/sales/clients/{client_id}")
def update_client(client_id: str, body: dict[str, Any] = Body(default={})):
    _ensure_sales()
    clients = get_collection("clients")
    row = next((x for x in clients if str(x.get("id")) == str(client_id)), None)
    if not row:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            row[k] = v
    set_collection("clients", clients)
    _append_audit("Client updated", row.get("name") or client_id)
    return row


# ── Case studies / activities / metrics ───────────────────────────────


@router.get("/sales/case-studies")
def list_case_studies():
    _ensure_sales()
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
    _ensure_sales()
    return get_collection("sales_activities")


@router.get("/sales/metrics/dashboard")
def metrics_dashboard():
    _ensure_sales()
    leads = get_collection("leads")
    clients = get_collection("clients")
    won = sum(1 for x in leads if x.get("stage") == "Won")
    pipeline = sum(float(x.get("budget") or 0) for x in leads if x.get("status") == "Active")
    return [
        {"id": "total-leads", "label": "Total Leads", "value": str(len(leads)), "icon": "person_add"},
        {"id": "won", "label": "Won Leads", "value": str(won), "icon": "emoji_events"},
        {
            "id": "active-clients",
            "label": "Active Clients",
            "value": str(sum(1 for c in clients if c.get("status") == "Active")),
            "icon": "groups",
        },
        {
            "id": "revenue",
            "label": "Est. Pipeline",
            "value": f"${pipeline:,.0f}",
            "icon": "trending_up",
        },
    ]


@router.get("/sales/metrics/leads")
def metrics_leads():
    _ensure_sales()
    return _lead_metrics(get_collection("leads"))


@router.get("/sales/metrics/clients")
def metrics_clients():
    _ensure_sales()
    return _client_metrics(get_collection("clients"))
