"""Phase 1 infrastructure verification (TASK-011/012/013/017).

- TASK-011: test DB reachable, migrations at head.
- TASK-012: per-test TRUNCATE isolation (canary pattern).
- TASK-013: factories deterministic (no randomness, unique codes).
- TASK-017: Base.metadata tables match the test database tables.
"""
from __future__ import annotations

from sqlalchemy import inspect, text

from app.core.database import AsyncSessionLocal
from app.core.models_registry import Base


def _portal(client, coro_factory, *args):
    return client.portal.call(coro_factory, *args)


def test_task011_test_db_at_head(client):
    async def _run():
        async with AsyncSessionLocal() as session:
            version = (
                await session.execute(text("SELECT version_num FROM alembic_version"))
            ).scalar_one()
            return version

    version = _portal(client, _run)
    assert version, "alembic_version missing in test DB"

    from alembic.config import Config
    from alembic.script import ScriptDirectory

    cfg = Config("alembic.ini")
    heads = ScriptDirectory.from_config(cfg).get_heads()
    assert version in heads, f"test DB at {version}, heads are {heads}"


def test_task017_metadata_matches_database(client):
    async def _run():
        from sqlalchemy.ext.asyncio import create_async_engine

        from app.core.config import settings

        engine = create_async_engine(settings.DATABASE_URL)
        try:
            async with engine.connect() as conn:
                db_tables = await conn.run_sync(
                    lambda c: set(inspect(c).get_table_names(schema="public"))
                )
            return db_tables
        finally:
            await engine.dispose()

    db_tables = _portal(client, _run)
    meta_tables = set(Base.metadata.tables)
    assert meta_tables <= db_tables, f"missing from DB: {sorted(meta_tables - db_tables)}"
    unexpected = db_tables - meta_tables - {"alembic_version"}
    assert not unexpected, f"unexpected DB tables: {sorted(unexpected)}"


def test_task012_truncate_isolation(client):
    """Canary: rows written here must be gone after the truncate cycle."""

    async def _count_canary():
        async with AsyncSessionLocal() as session:
            n = (
                await session.execute(
                    text("SELECT COUNT(*) FROM departments WHERE name LIKE 'Canary-%'")
                )
            ).scalar_one()
            return n

    async def _insert_canary(tag: str):
        async with AsyncSessionLocal() as session:
            await session.execute(
                text("INSERT INTO departments (name) VALUES (:name)"),
                {"name": f"Canary-{tag}"},
            )
            await session.commit()

    assert _portal(client, _count_canary) == 0
    _portal(client, _insert_canary, "012")
    assert _portal(client, _count_canary) == 1


def test_task013_factories_deterministic(factory, client):
    # File order: runs after test_task012, whose Canary row must be gone.
    async def _count_canary():
        async with AsyncSessionLocal() as session:
            return (
                await session.execute(
                    text("SELECT COUNT(*) FROM departments WHERE name LIKE 'Canary-%'")
                )
            ).scalar_one()

    assert client.portal.call(_count_canary) == 0
    a = factory.actor("det")
    b = factory.actor("det")
    assert a["employment_id"] != b["employment_id"]
    assert a["email"] != b["email"]
    assert a["code"] != b["code"]
    assert a["headers"] != b["headers"]
    assert a["headers"]["Authorization"].startswith("Bearer ")
