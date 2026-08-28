"""Projects module mock routes — projects, tasks, teams, documents, notes."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Body, Query

from store import get_collection, get_obj, set_collection, set_obj

router = APIRouter(tags=["projects"])


def _now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _paginate(items: list[Any], page: int = 1, page_size: int = 20) -> dict[str, Any]:
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 100))
    total = len(items)
    start = (page - 1) * page_size
    return {
        "items": items[start : start + page_size],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


def _next_id(collection: str) -> int:
    items = get_collection(collection)
    nums = [int(x.get("id")) for x in items if isinstance(x.get("id"), int)]
    return (max(nums) + 1) if nums else 1


def _project_metrics(items: list[dict]) -> dict[str, Any]:
    total = len(items)
    by_status: dict[str, int] = {}
    progress_sum = 0
    for p in items:
        st = str(p.get("status") or "UNKNOWN")
        by_status[st] = by_status.get(st, 0) + 1
        progress_sum += int(p.get("progress") or 0)
    avg = round(progress_sum / total, 1) if total else 0
    return {
        "total": total,
        "byStatus": by_status,
        "averageProgress": avg,
        "inProgress": by_status.get("IN_PROGRESS", 0),
        "planning": by_status.get("PLANNING", 0),
        "onHold": by_status.get("ON_HOLD", 0),
        "completed": by_status.get("COMPLETED", 0),
    }


def _employees() -> list[dict]:
    rows = get_obj("project_employees")
    if isinstance(rows, list) and rows:
        return rows
    return []


@router.get("/projects")
def list_projects(
    search: Optional[str] = None,
    status: Optional[str] = None,
    teamId: Optional[int] = None,
    page: Optional[int] = Query(default=None),
    pageSize: Optional[int] = Query(default=None),
):
    items = list(get_collection("projects"))
    if search:
        q = search.lower()
        items = [
            p for p in items
            if q in str(p.get("name") or "").lower()
            or q in str(p.get("code") or "").lower()
            or q in str(p.get("clientName") or "").lower()
        ]
    if status:
        items = [p for p in items if p.get("status") == status]
    if teamId is not None:
        items = [p for p in items if p.get("teamId") == teamId]
    metrics = _project_metrics(items)
    if page is not None or pageSize is not None:
        page_data = _paginate(items, page or 1, pageSize or 20)
        return {**page_data, "metrics": metrics}
    return {"items": items, "total": len(items), "metrics": metrics}


@router.get("/projects/{project_id:int}")
def get_project(project_id: int):
    row = next((p for p in get_collection("projects") if p.get("id") == project_id), None)
    return row or {"detail": "not found"}


@router.post("/projects")
def create_project(body: dict[str, Any] = Body(default={})):
    projects = get_collection("projects")
    pid = _next_id("projects")
    if pid < 1024:
        pid = 1030
    row = {
        "id": pid,
        "name": body.get("name") or f"Project {pid}",
        "code": body.get("code") or f"PRJ-{pid}",
        "status": "PLANNING",
        "clientId": body.get("clientId"),
        "clientName": body.get("clientName"),
        "startDate": body.get("startDate"),
        "endDate": body.get("endDate"),
        "progress": 0,
        "teamCount": 1 if body.get("teamId") else 0,
        "taskCount": 0,
        "teamId": body.get("teamId"),
        "description": body.get("description"),
        "repositoryUrl": body.get("repositoryUrl"),
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
    }
    projects.insert(0, row)
    set_collection("projects", projects)
    return row


@router.patch("/projects/{project_id:int}")
@router.put("/projects/{project_id:int}")
def update_project(project_id: int, body: dict[str, Any] = Body(default={})):
    projects = get_collection("projects")
    row = next((p for p in projects if p.get("id") == project_id), None)
    if not row:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            row[k] = v
    if "teamId" in body:
        row["teamCount"] = 1 if body.get("teamId") is not None else 0
    row["updatedAt"] = _now_iso()
    set_collection("projects", projects)
    return row


@router.get("/projects/{project_id:int}/teams")
def teams_for_project(project_id: int):
    projects = get_collection("projects")
    project = next((p for p in projects if p.get("id") == project_id), None)
    if not project:
        return {"items": []}
    team_id = project.get("teamId")
    teams = get_collection("teams")
    if team_id is not None:
        t = next((x for x in teams if x.get("id") == team_id), None)
        return {"items": [t] if t else []}
    name = project.get("name")
    matched = [t for t in teams if t.get("projectName") and t.get("projectName") == name]
    return {"items": matched}


@router.get("/projects/tasks")
@router.get("/tasks")
def list_tasks(
    search: Optional[str] = None,
    status: Optional[str] = None,
    projectId: Optional[int] = None,
    page: Optional[int] = Query(default=None),
    pageSize: Optional[int] = Query(default=None),
):
    items = list(get_collection("tasks"))
    if projectId is not None:
        items = [t for t in items if t.get("projectId") == projectId]
    if search:
        q = search.lower()
        items = [
            t for t in items
            if q in str(t.get("title") or "").lower()
            or q in str(t.get("projectName") or "").lower()
            or q in str(t.get("assigneeName") or "").lower()
        ]
    if status:
        items = [t for t in items if t.get("status") == status]
    if page is not None or pageSize is not None:
        return _paginate(items, page or 1, pageSize or 20)
    return {"items": items, "total": len(items)}


@router.get("/projects/tasks/{task_id}")
@router.get("/tasks/{task_id}")
def get_task(task_id: int):
    row = next((t for t in get_collection("tasks") if t.get("id") == task_id), None)
    return row or {"detail": "not found"}


@router.post("/projects/tasks")
@router.post("/tasks")
def create_task(body: dict[str, Any] = Body(default={})):
    tasks = get_collection("tasks")
    tid = _next_id("tasks")
    project_id = body.get("projectId")
    project_name = body.get("projectName")
    if project_id and not project_name:
        p = next((x for x in get_collection("projects") if x.get("id") == project_id), None)
        if p:
            project_name = p.get("name")
    row = {
        "id": tid,
        "title": body.get("title") or "Untitled task",
        "description": body.get("description"),
        "priority": body.get("priority") or "MEDIUM",
        "status": "TODO",
        "projectId": project_id or 0,
        "projectName": project_name,
        "assigneeName": body.get("assigneeName"),
        "dueDate": body.get("dueDate"),
        "createdAt": _now_iso(),
    }
    tasks.insert(0, row)
    set_collection("tasks", tasks)
    if project_id:
        projects = get_collection("projects")
        for p in projects:
            if p.get("id") == project_id:
                p["taskCount"] = int(p.get("taskCount") or 0) + 1
                p["updatedAt"] = _now_iso()
                break
        set_collection("projects", projects)
    return row


@router.patch("/projects/tasks/{task_id}")
@router.put("/projects/tasks/{task_id}")
def update_task(task_id: int, body: dict[str, Any] = Body(default={})):
    tasks = get_collection("tasks")
    row = next((t for t in tasks if t.get("id") == task_id), None)
    if not row:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            row[k] = v
    set_collection("tasks", tasks)
    return row


@router.get("/projects/teams")
@router.get("/teams")
def list_teams(
    search: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    page: Optional[int] = Query(default=None),
    pageSize: Optional[int] = Query(default=None),
):
    items = list(get_collection("teams"))
    if search:
        q = search.lower()
        items = [
            t for t in items
            if q in str(t.get("name") or "").lower()
            or q in str(t.get("department") or "").lower()
            or q in str(t.get("headName") or "").lower()
        ]
    if status and status != "All":
        want_active = status in ("Active", "ACTIVE")
        want_inactive = status in ("Inactive", "INACTIVE")
        items = [
            t for t in items
            if (want_active and t.get("status") == "ACTIVE")
            or (want_inactive and t.get("status") != "ACTIVE")
            or (not want_active and not want_inactive)
        ]
    if department and department != "All":
        d = department.lower()
        items = [t for t in items if (t.get("department") or "").lower() == d]
    if page is not None or pageSize is not None:
        return _paginate(items, page or 1, pageSize or 20)
    return {"items": items, "total": len(items)}


@router.get("/projects/teams/{team_id}")
@router.get("/teams/{team_id}")
def get_team(team_id: int):
    row = next((t for t in get_collection("teams") if t.get("id") == team_id), None)
    return row or {"detail": "not found"}


@router.post("/projects/teams")
@router.post("/teams")
def create_team(body: dict[str, Any] = Body(default={})):
    teams = get_collection("teams")
    tid = _next_id("teams")
    member_names = body.get("memberNames") or []
    head = body.get("headName")
    member_count = len(member_names) + (1 if head else 0)
    row = {
        "id": tid,
        "name": body.get("name") or f"Team {tid}",
        "description": body.get("description"),
        "department": body.get("department") or "Engineering",
        "headName": head,
        "headRole": body.get("headRole") or ("Team Lead" if head else None),
        "projectName": body.get("projectName"),
        "memberCount": member_count,
        "projectCount": 1 if body.get("projectId") else 0,
        "status": "ACTIVE",
        "createdAt": _now_iso(),
    }
    teams.insert(0, row)
    set_collection("teams", teams)
    if body.get("projectId"):
        projects = get_collection("projects")
        for p in projects:
            if p.get("id") == body.get("projectId"):
                p["teamId"] = tid
                p["teamCount"] = 1
                p["updatedAt"] = _now_iso()
                if not row.get("projectName"):
                    row["projectName"] = p.get("name")
                break
        set_collection("projects", projects)
        set_collection("teams", teams)
    return row


@router.patch("/projects/teams/{team_id}")
@router.put("/projects/teams/{team_id}")
def update_team(team_id: int, body: dict[str, Any] = Body(default={})):
    teams = get_collection("teams")
    row = next((t for t in teams if t.get("id") == team_id), None)
    if not row:
        return {"detail": "not found"}
    for k, v in body.items():
        if k != "id":
            row[k] = v
    set_collection("teams", teams)
    return row


@router.get("/projects/teams/{team_id}/members")
def team_members(team_id: int):
    teams = get_collection("teams")
    team = next((t for t in teams if t.get("id") == team_id), None)
    if not team:
        return []
    emps = _employees()
    dept = (team.get("department") or "").lower()
    filtered = [e for e in emps if (e.get("department") or "").lower() == dept]
    if not filtered:
        filtered = emps[: max(int(team.get("memberCount") or 3), 3)]
    elif len(filtered) > int(team.get("memberCount") or 0) > 0:
        filtered = filtered[: int(team.get("memberCount"))]
    head = (team.get("headName") or "").lower()
    out = []
    for e in filtered:
        is_head = head and (e.get("fullName") or "").lower() == head
        out.append({
            "id": str(e.get("id")),
            "name": e.get("fullName"),
            "title": e.get("role") or "Member",
            "role": "Lead" if is_head else "Member",
            "email": e.get("email") or "",
            "status": "On Leave" if e.get("status") == "ON_LEAVE" else "Active",
            "joined": e.get("joiningDate") or "—",
        })
    out.sort(key=lambda x: (0 if x["role"] == "Lead" else 1, x["name"] or ""))
    return out


def _project_ui_status(status: str) -> str:
    if status == "COMPLETED":
        return "Completed"
    if status in ("ON_HOLD", "CANCELLED"):
        return "On Hold"
    return "Active"


@router.get("/projects/teams/{team_id}/projects")
def team_projects(team_id: int):
    teams = get_collection("teams")
    team = next((t for t in teams if t.get("id") == team_id), None)
    if not team:
        return []
    projects = get_collection("projects")
    linked = [
        p for p in projects
        if p.get("teamId") == team_id
        or (team.get("projectName") and p.get("name") == team.get("projectName"))
    ]
    if not linked:
        linked = projects[: max(int(team.get("projectCount") or 1), 1)]
    out = []
    for p in linked:
        end = p.get("endDate") or "—"
        out.append({
            "id": p.get("id"),
            "name": p.get("name"),
            "client": p.get("clientName") or "—",
            "status": _project_ui_status(str(p.get("status") or "")),
            "due": end,
            "pct": p.get("progress") or 0,
            "role": "Primary" if team.get("projectName") == p.get("name") else "Support",
        })
    return out


@router.get("/projects/documents")
@router.get("/documents")
def list_documents(
    projectId: Optional[int] = None,
    search: Optional[str] = None,
    referenceType: Optional[str] = None,
    referenceId: Optional[int] = None,
    page: Optional[int] = Query(default=None),
    pageSize: Optional[int] = Query(default=None),
):
    items = list(get_collection("project_documents"))
    if projectId is not None:
        items = [d for d in items if d.get("projectId") == projectId]
    if referenceType:
        items = [d for d in items if d.get("referenceType") == referenceType]
    if referenceId is not None:
        items = [d for d in items if d.get("referenceId") == referenceId]
    if search:
        q = search.lower()
        items = [
            d for d in items
            if q in str(d.get("name") or "").lower()
            or q in str(d.get("uploadedBy") or "").lower()
            or q in str(d.get("type") or "").lower()
        ]
    if page is not None or pageSize is not None:
        return _paginate(items, page or 1, pageSize or 20)
    return {"items": items, "total": len(items)}


@router.get("/projects/{project_id:int}/notes")
@router.get("/projects/notes")
def list_notes(project_id: Optional[int] = None, projectId: Optional[int] = None):
    pid = project_id or projectId
    items = list(get_collection("project_notes"))
    if pid is not None:
        items = [n for n in items if n.get("projectId") == pid]
    return {"items": items, "total": len(items)}


@router.post("/projects/{project_id:int}/notes")
def create_note(project_id: int, body: dict[str, Any] = Body(default={})):
    notes = get_collection("project_notes")
    row = {
        "id": f"note-{int(datetime.utcnow().timestamp() * 1000)}",
        "projectId": project_id,
        "body": body.get("body") or body.get("content") or "",
        "author": body.get("author") or "Current User",
        "createdAt": _now_iso(),
    }
    notes.insert(0, row)
    set_collection("project_notes", notes)
    return row
