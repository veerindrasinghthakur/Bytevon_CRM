"""Phase 4: project teams, tasks, projects, notes, documents."""
from __future__ import annotations

from sqlalchemy import select

from app.modules.project.project.models import Project
from app.modules.project.task.models import Task
from tests.modules.helpers import db_scalar, record_coverage

COVERED = [
    ("POST", "/api/v1/projects/teams"),
    ("GET", "/api/v1/projects/teams"),
    ("GET", "/api/v1/projects/teams/{team_id}"),
    ("PATCH", "/api/v1/projects/teams/{team_id}"),
    ("POST", "/api/v1/projects/teams/{team_id}/members"),
    ("DELETE", "/api/v1/projects/teams/{team_id}/members/{employment_id}"),
    ("GET", "/api/v1/projects/teams/{team_id}/members"),
    ("POST", "/api/v1/projects/tasks"),
    ("GET", "/api/v1/projects/tasks"),
    ("GET", "/api/v1/projects/tasks/{task_id}"),
    ("PATCH", "/api/v1/projects/tasks/{task_id}"),
    ("POST", "/api/v1/projects/time-entries"),
    ("GET", "/api/v1/projects/tasks/{task_id}/time-entries"),
    ("GET", "/api/v1/projects/projects/{project_id}/tasks"),
    ("POST", "/api/v1/projects/"),
    ("GET", "/api/v1/projects/"),
    ("GET", "/api/v1/projects/{project_id}/teams"),
    ("GET", "/api/v1/projects/{project_id}"),
    ("PATCH", "/api/v1/projects/{project_id}"),
    ("POST", "/api/v1/projects/notes"),
    ("GET", "/api/v1/projects/notes"),
    ("GET", "/api/v1/projects/notes/{note_id}"),
    ("PATCH", "/api/v1/projects/notes/{note_id}"),
    ("POST", "/api/v1/projects/document-types"),
    ("GET", "/api/v1/projects/document-types"),
    ("PATCH", "/api/v1/projects/document-types/{type_id}"),
    ("POST", "/api/v1/projects/document-types/{type_id}/archive"),
    ("POST", "/api/v1/projects/documents"),
    ("GET", "/api/v1/projects/documents/{document_id}"),
    ("POST", "/api/v1/projects/documents/{document_id}/versions"),
    ("POST", "/api/v1/projects/documents/{document_id}/archive"),
    ("POST", "/api/v1/projects/links"),
    ("GET", "/api/v1/projects/links/by-entity"),
    ("GET", "/api/v1/projects/documents/{document_id}/links"),
]


def _sa(factory):
    return factory.super_admin()


def _setup(factory, client):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("prj")
    member = factory.actor("prjm")
    team = client.post(
        "/api/v1/projects/teams",
        json={
            "name": "Alpha",
            "team_head_employment_id": actor["employment_id"],
        },
        headers=h,
    )
    assert team.status_code == 201, team.text
    team_id = team.json()["id"]
    client_obj = client.post(
        "/api/v1/sales/clients",
        json={"client_type": "COMPANY", "client_name": "ProjCo"},
        headers=h,
    ).json()
    project = client.post(
        "/api/v1/projects/",
        json={
            "client_id": client_obj["id"],
            "project_name": "Website Revamp",
            "assignment_type": "TEAM",
            "assigned_to_id": team_id,
        },
        headers=h,
    )
    assert project.status_code == 201, project.text
    return sa, actor, member, team_id, project.json()["id"]


def test_teams_and_project(client, factory):
    sa, actor, member, team_id, project_id = _setup(factory, client)
    h = sa["headers"]

    listed = client.get("/api/v1/projects/teams", headers=h)
    assert listed.status_code == 200
    assert any(t["id"] == team_id for t in listed.json())

    got = client.get(f"/api/v1/projects/teams/{team_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/projects/teams/{team_id}", json={"description": "A-team"}, headers=h
    )
    assert updated.status_code == 200, updated.text

    added = client.post(
        f"/api/v1/projects/teams/{team_id}/members",
        json={"employment_id": member["employment_id"], "team_role": "Developer"},
        headers=h,
    )
    assert added.status_code in (200, 201), added.text

    members = client.get(f"/api/v1/projects/teams/{team_id}/members", headers=h)
    assert members.status_code == 200
    assert len(members.json()) >= 1

    removed = client.delete(
        f"/api/v1/projects/teams/{team_id}/members/{member['employment_id']}",
        headers=h,
    )
    assert removed.status_code == 200, removed.text

    projects = client.get("/api/v1/projects/", headers=h)
    assert projects.status_code == 200
    assert any(p["id"] == project_id for p in projects.json())

    teams_for_project = client.get(f"/api/v1/projects/{project_id}/teams", headers=h)
    assert teams_for_project.status_code == 200, teams_for_project.text

    got_p = client.get(f"/api/v1/projects/{project_id}", headers=h)
    assert got_p.status_code == 200

    upd_p = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"description": "new scope"},
        headers=h,
    )
    assert upd_p.status_code == 200, upd_p.text
    assert (
        db_scalar(client, select(Project.description).where(Project.id == project_id))
        == "new scope"
    )
    record_coverage(
        "test_teams_and_project",
        COVERED[:7] + COVERED[14:19],
    )


def test_tasks_and_time_entries(client, factory):
    sa, actor, _member, _team_id, project_id = _setup(factory, client)
    h = sa["headers"]

    task = client.post(
        "/api/v1/projects/tasks",
        json={
            "project_id": project_id,
            "title": "Design homepage",
            "assignee_employment_id": sa["employment_id"],
        },
        headers=h,
    )
    assert task.status_code == 201, task.text
    task_id = task.json()["id"]
    assert db_scalar(client, select(Task.title).where(Task.id == task_id)) == "Design homepage"

    listed = client.get("/api/v1/projects/tasks", headers=h)
    assert listed.status_code == 200
    assert any(t["id"] == task_id for t in listed.json())

    got = client.get(f"/api/v1/projects/tasks/{task_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/projects/tasks/{task_id}", json={"status": "IN_PROGRESS"}, headers=h
    )
    assert updated.status_code == 200, updated.text

    entry = client.post(
        "/api/v1/projects/time-entries",
        json={"task_id": task_id, "work_date": "2026-09-10", "duration_minutes": 120},
        headers=h,
    )
    assert entry.status_code == 201, entry.text

    entries = client.get(f"/api/v1/projects/tasks/{task_id}/time-entries", headers=h)
    assert entries.status_code == 200
    assert len(entries.json()) >= 1

    by_project = client.get(f"/api/v1/projects/projects/{project_id}/tasks", headers=h)
    assert by_project.status_code == 200, by_project.text
    assert any(t["id"] == task_id for t in by_project.json())
    record_coverage("test_tasks_and_time_entries", COVERED[7:14])


def test_notes_and_documents(client, factory):
    sa, actor, _member, _team_id, project_id = _setup(factory, client)
    h = sa["headers"]

    task = client.post(
        "/api/v1/projects/tasks",
        json={"project_id": project_id, "title": "Noted task"},
        headers=h,
    )
    assert task.status_code == 201, task.text
    task_id = task.json()["id"]

    note = client.post(
        "/api/v1/projects/notes",
        json={
            "reference_type": "TASK",
            "reference_id": task_id,
            "title": "Kickoff",
            "content": "Met the client",
        },
        headers=h,
    )
    assert note.status_code == 201, note.text
    note_id = note.json()["id"]
    listed = client.get(
        "/api/v1/projects/notes",
        params={"reference_type": "TASK", "reference_id": task_id},
        headers=h,
    )
    assert listed.status_code == 200
    assert any(n["id"] == note_id for n in listed.json())
    assert client.get(f"/api/v1/projects/notes/{note_id}", headers=h).status_code == 200
    assert (
        client.patch(
            f"/api/v1/projects/notes/{note_id}", json={"title": "Kickoff v2"}, headers=h
        ).status_code
        == 200
    )

    dtype = client.post(
        "/api/v1/projects/document-types", json={"name": "Contract"}, headers=h
    )
    assert dtype.status_code == 201, dtype.text
    type_id = dtype.json()["id"]
    assert client.get("/api/v1/projects/document-types", headers=h).status_code == 200
    assert (
        client.patch(
            f"/api/v1/projects/document-types/{type_id}",
            json={"description": "legal"},
            headers=h,
        ).status_code
        == 200
    )

    doc = client.post(
        "/api/v1/projects/documents",
        json={
            "document_type_id": type_id,
            "title": "MSA",
            "file_reference": "minio/msa-v1.pdf",
            "file_name": "msa-v1.pdf",
            "mime_type": "application/pdf",
            "file_size": 1024,
        },
        headers=h,
    )
    assert doc.status_code == 201, doc.text
    doc_id = doc.json()["id"]

    got_doc = client.get(f"/api/v1/projects/documents/{doc_id}", headers=h)
    assert got_doc.status_code == 200, got_doc.text

    ver = client.post(
        f"/api/v1/projects/documents/{doc_id}/versions",
        json={
            "file_reference": "minio/msa-v2.pdf",
            "file_name": "msa-v2.pdf",
            "mime_type": "application/pdf",
            "file_size": 2048,
        },
        headers=h,
    )
    assert ver.status_code == 201, ver.text

    link = client.post(
        "/api/v1/projects/links",
        json={"document_id": doc_id, "entity_type": "PROJECT", "entity_id": project_id},
        headers=h,
    )
    assert link.status_code == 201, link.text

    by_entity = client.get(
        "/api/v1/projects/links/by-entity",
        params={"entity_type": "PROJECT", "entity_id": project_id},
        headers=h,
    )
    assert by_entity.status_code == 200, by_entity.text

    doc_links = client.get(f"/api/v1/projects/documents/{doc_id}/links", headers=h)
    assert doc_links.status_code == 200, doc_links.text

    assert (
        client.post(f"/api/v1/projects/documents/{doc_id}/archive", headers=h).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/v1/projects/document-types/{type_id}/archive", headers=h
        ).status_code
        == 200
    )
    record_coverage("test_notes_and_documents", COVERED[19:])
