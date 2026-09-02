"""Approvals module mock routes — kpis, pending, my-requests, detail, decide."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["approvals"])


def _all_rows() -> list[dict[str, Any]]:
    pending = list(get_collection("approval_pending") or [])
    mine = list(get_collection("approval_my_requests") or [])
    # Prefer pending on id collision
    by_id: dict[str, dict[str, Any]] = {}
    for r in mine + pending:
        by_id[str(r.get("id"))] = r
    return list(by_id.values())


@router.get("/approvals/kpis")
def get_kpis():
    k = get_obj("approval_kpis") or {}
    return {
        "total": k.get("total", 0),
        "pending": k.get("pending", 0),
        "approvedToday": k.get("approvedToday", 0),
        "rejectedToday": k.get("rejectedToday", 0),
        "overdue": k.get("overdue", 0),
    }


@router.get("/approvals/pending")
def list_pending(
    search: Optional[str] = None,
    type: Optional[str] = None,
    priority: Optional[str] = None,
):
    items = list(get_collection("approval_pending") or [])
    if search:
        q = search.lower()
        items = [
            r
            for r in items
            if q in str(r.get("id") or "").lower()
            or q in str(r.get("requester") or "").lower()
            or q in str(r.get("type") or "").lower()
        ]
    if type and type != "All":
        items = [r for r in items if r.get("type") == type]
    if priority and priority != "All":
        items = [r for r in items if r.get("priority") == priority]
    return items


@router.get("/approvals/my-requests")
def list_my_requests(
    search: Optional[str] = None,
    status: Optional[str] = None,
):
    items = list(get_collection("approval_my_requests") or [])
    if search:
        q = search.lower()
        items = [
            r
            for r in items
            if q in str(r.get("id") or "").lower()
            or q in str(r.get("type") or "").lower()
            or q in str(r.get("stage") or "").lower()
        ]
    if status and status != "All":
        items = [r for r in items if r.get("status") == status]
    return items


@router.get("/approvals/approvers")
def list_approvers():
    return list(get_obj("approval_approvers") or [])


@router.get("/approvals/{request_id}")
def get_detail(request_id: str):
    for r in _all_rows():
        if str(r.get("id")) == str(request_id):
            return dict(r)
    return {"detail": "not found"}


@router.post("/approvals/{request_id}/approve")
def approve(request_id: str, body: dict[str, Any] = Body(default={})):
    return _decide(request_id, "Approved", body.get("comment"))


@router.post("/approvals/{request_id}/reject")
def reject(request_id: str, body: dict[str, Any] = Body(default={})):
    return _decide(request_id, "Rejected", body.get("comment"))


def _decide(request_id: str, new_status: str, comment: Any = None) -> dict[str, Any]:
    pending = list(get_collection("approval_pending") or [])
    mine = list(get_collection("approval_my_requests") or [])
    found: dict[str, Any] | None = None

    for r in pending:
        if str(r.get("id")) == str(request_id):
            r["status"] = new_status
            r["stage"] = "Completed" if new_status == "Approved" else "Denied"
            if comment:
                r["decisionComment"] = comment
            found = r
            break

    if found:
        # Move out of pending into my-requests trail (or keep snapshot)
        pending = [r for r in pending if str(r.get("id")) != str(request_id)]
        set_collection("approval_pending", pending)
        # Upsert into my_requests as historical
        replaced = False
        for r in mine:
            if str(r.get("id")) == str(request_id):
                r.update(found)
                replaced = True
                break
        if not replaced:
            mine.insert(0, dict(found))
        set_collection("approval_my_requests", mine)
    else:
        for r in mine:
            if str(r.get("id")) == str(request_id):
                r["status"] = new_status
                r["stage"] = "Completed" if new_status == "Approved" else "Denied"
                if comment:
                    r["decisionComment"] = comment
                found = r
                break
        if found:
            set_collection("approval_my_requests", mine)

    # Bump KPIs roughly
    k = dict(get_obj("approval_kpis") or {})
    if found:
        k["pending"] = max(0, int(k.get("pending") or 0) - 1)
        if new_status == "Approved":
            k["approvedToday"] = int(k.get("approvedToday") or 0) + 1
        else:
            k["rejectedToday"] = int(k.get("rejectedToday") or 0) + 1
        set_obj("approval_kpis", k)

    if not found:
        return {"detail": "not found"}
    return {"ok": True, "id": request_id, "status": new_status}
