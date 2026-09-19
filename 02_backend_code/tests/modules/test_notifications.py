"""Phase 4: notifications templates, compose/notify, center, preferences, misc."""
from __future__ import annotations

from tests.modules.helpers import grant, record_coverage, table_count

COVERED = [
    ("POST", "/api/v1/notifications/templates"),
    ("GET", "/api/v1/notifications/templates"),
    ("GET", "/api/v1/notifications/templates/{template_id}"),
    ("PATCH", "/api/v1/notifications/templates/{template_id}"),
    ("GET", "/api/v1/notifications/triggers"),
    ("POST", "/api/v1/notifications/notify"),
    ("POST", "/api/v1/notifications/notify/bulk"),
    ("POST", "/api/v1/notifications/compose"),
    ("POST", "/api/v1/notifications/drafts"),
    ("GET", "/api/v1/notifications/channels"),
    ("GET", "/api/v1/notifications/preferences"),
    ("PUT", "/api/v1/notifications/preferences"),
    ("GET", "/api/v1/notifications/sent"),
    ("GET", "/api/v1/notifications/inbox"),
    ("GET", "/api/v1/notifications/inbox/all"),
    ("GET", "/api/v1/notifications/inbox/unread-count"),
    ("POST", "/api/v1/notifications/inbox/{notification_id}/read"),
    ("POST", "/api/v1/notifications/{notification_id}/read"),
    ("POST", "/api/v1/notifications/read-all"),
    ("POST", "/api/v1/notifications/inbox/{notification_id}/archive"),
    ("POST", "/api/v1/notifications/{notification_id}/archive"),
    ("POST", "/api/v1/notifications/archive-read"),
]


def _sa(factory):
    return factory.super_admin()


def test_template_lifecycle_and_triggers(client, factory):
    h = _sa(factory)["headers"]
    before = table_count(client, "notification_templates")
    created = client.post(
        "/api/v1/notifications/templates",
        json={
            "code": "WELCOME",
            "title_template": "Welcome {{name}}",
            "body_template": "Hello {{name}}",
        },
        headers=h,
    )
    assert created.status_code == 201, created.text
    tpl_id = created.json()["id"]
    assert table_count(client, "notification_templates") == before + 1

    listed = client.get("/api/v1/notifications/templates", headers=h)
    assert listed.status_code == 200
    assert any(t["id"] == tpl_id for t in listed.json())

    got = client.get(f"/api/v1/notifications/templates/{tpl_id}", headers=h)
    assert got.status_code == 200

    updated = client.patch(
        f"/api/v1/notifications/templates/{tpl_id}",
        json={"title_template": "Welcome aboard {{name}}"},
        headers=h,
    )
    assert updated.status_code == 200, updated.text

    triggers = client.get("/api/v1/notifications/triggers", headers=h)
    assert triggers.status_code == 200
    record_coverage("test_template_lifecycle_and_triggers", COVERED[:5])


def test_notify_compose_drafts_channels(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("ntf")
    grant(client, h, actor["employment_id"], "notification", "CREATE", "SELF", "Notify Self")
    ah = actor["headers"]

    sent = client.post(
        "/api/v1/notifications/notify",
        json={
            "recipient_type": "EMPLOYMENT",
            "recipient_id": actor["employment_id"],
            "title": "Hello",
            "body": "World",
        },
        headers=h,
    )
    assert sent.status_code == 201, sent.text

    bulk = client.post(
        "/api/v1/notifications/notify/bulk",
        json={"employment_ids": [actor["employment_id"]], "title": "Hi", "body": "All"},
        headers=h,
    )
    assert bulk.status_code == 201, bulk.text

    composed = client.post(
        "/api/v1/notifications/compose",
        json={"employment_ids": [actor["employment_id"]], "title": "C", "body": "B"},
        headers=h,
    )
    assert composed.status_code == 201, composed.text

    draft = client.post(
        "/api/v1/notifications/drafts",
        json={"title": "Draft", "body": "later"},
        headers=ah,
    )
    assert draft.status_code == 201, draft.text

    channels = client.get("/api/v1/notifications/channels", headers=h)
    assert channels.status_code == 200
    record_coverage("test_notify_compose_drafts_channels", COVERED[5:10])


def test_preferences_and_sent(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("ntf2")
    grant(client, h, actor["employment_id"], "notification", "VIEW", "SELF", "Notif Self View")
    grant(client, h, actor["employment_id"], "notification", "UPDATE", "SELF", "Notif Self Update")
    ah = actor["headers"]

    prefs = client.get("/api/v1/notifications/preferences", headers=ah)
    assert prefs.status_code == 200, prefs.text

    updated = client.put(
        "/api/v1/notifications/preferences",
        json={"channel": "EMAIL", "is_enabled": False},
        headers=ah,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["is_enabled"] is False

    sent = client.get("/api/v1/notifications/sent", headers=h)
    assert sent.status_code == 200, sent.text
    record_coverage("test_preferences_and_sent", COVERED[10:13])


def test_inbox_flows(client, factory):
    sa = _sa(factory)
    h = sa["headers"]
    actor = factory.actor("ntf3")
    grant(client, h, actor["employment_id"], "notification", "VIEW", "SELF", "Inbox View")
    grant(client, h, actor["employment_id"], "notification", "UPDATE", "SELF", "Inbox Update")
    ah = actor["headers"]
    emp_id = actor["employment_id"]

    notified = client.post(
        "/api/v1/notifications/notify",
        json={
            "recipient_type": "EMPLOYMENT",
            "recipient_id": emp_id,
            "title": "Task assigned",
            "body": "You have a task",
        },
        headers=h,
    )
    assert notified.status_code == 201, notified.text
    nid = notified.json()["id"]

    inbox = client.get("/api/v1/notifications/inbox", headers=ah)
    assert inbox.status_code == 200
    assert any(n["id"] == nid for n in inbox.json())

    assert client.get("/api/v1/notifications/inbox/all", headers=ah).status_code == 200
    count = client.get("/api/v1/notifications/inbox/unread-count", headers=ah)
    assert count.status_code == 200
    assert count.json().get("unread", count.json().get("count", 1)) >= 1

    assert (
        client.post(f"/api/v1/notifications/inbox/{nid}/read", headers=ah).status_code
        == 200
    )
    notified2 = client.post(
        "/api/v1/notifications/notify",
        json={
            "recipient_type": "EMPLOYMENT",
            "recipient_id": emp_id,
            "title": "Second",
            "body": "msg",
        },
        headers=h,
    ).json()
    nid2 = notified2["id"]
    assert (
        client.post(f"/api/v1/notifications/{nid2}/read", headers=ah).status_code == 200
    )
    assert client.post("/api/v1/notifications/read-all", headers=ah).status_code == 200
    assert (
        client.post(
            f"/api/v1/notifications/inbox/{nid}/archive", headers=ah
        ).status_code
        == 200
    )
    assert (
        client.post(f"/api/v1/notifications/{nid2}/archive", headers=ah).status_code
        == 200
    )
    assert client.post("/api/v1/notifications/archive-read", headers=ah).status_code == 200
    record_coverage("test_inbox_flows", COVERED[13:])
