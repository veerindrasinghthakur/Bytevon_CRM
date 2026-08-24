"""Audit logs + security events (read-heavy, append on demand)."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Query

from app.services import store

router = APIRouter(tags=["admin-audit"])


@router.get("/admin/audit")
@router.get("/audit/logs")
def list_audit(
    search: str | None = Query(None),
    action: str | None = Query(None),
    module: str | None = Query(None),
):
    logs = store.read_list("audit_logs.json")
    items = []
    for log in logs:
        items.append({
            "id": log.get("id"),
            "action": log.get("action"),
            "actor": log.get("actor"),
            "actorInitials": log.get("actor_initials") or log.get("actorInitials"),
            "target": log.get("target"),
            "module": log.get("module"),
            "timestamp": log.get("timestamp"),
            "ip": log.get("ip"),
        })
    if search:
        q = search.lower()
        items = [
            i for i in items
            if q in (i["action"] or "").lower()
            or q in (i["actor"] or "").lower()
            or q in (i["target"] or "").lower()
            or q in (i["module"] or "").lower()
        ]
    if action and action != "All Actions":
        items = [i for i in items if action.lower() in (i["action"] or "").lower()]
    if module and module != "All Modules":
        items = [i for i in items if i["module"] == module]
    return {"items": items, "total": len(items)}


@router.post("/admin/audit")
@router.post("/audit/logs")
def append_audit(body: dict):
    logs = store.read_list("audit_logs.json")
    aid = store.next_id("next_audit_id")
    row = {
        "id": f"AUD-{aid}",
        "action": body.get("action") or "Custom event",
        "actor": body.get("actor") or "System",
        "actor_initials": body.get("actorInitials") or body.get("actor_initials") or "SY",
        "target": body.get("target") or "—",
        "module": body.get("module") or "System",
        "timestamp": body.get("timestamp") or datetime.utcnow().strftime("%b %d, %Y %H:%M"),
        "ip": body.get("ip") or "—",
    }
    logs.insert(0, row)
    store.write("audit_logs.json", logs)
    return row


@router.get("/admin/security/events")
def security_events():
    events = store.read_list("security_events.json")
    return [
        {
            "id": e.get("id"),
            "eventType": e.get("event_type") or e.get("eventType"),
            "identity": e.get("identity"),
            "source": e.get("source"),
            "timestamp": e.get("timestamp"),
            "status": e.get("status"),
        }
        for e in events
    ]
