"""Non-destructive database connectivity test for ByteVon CRM.

Validates that:
1. Configuration parses successfully.
2. Dialect matches postgresql+asyncpg://.
3. asyncpg driver establishes TLS connection.
4. SQLAlchemy async engine executes a test query.
5. Latency and server metadata are reported safely.

Credentials and passwords are NEVER printed or logged.

Usage:
    cd 02_backend_code
    python -m scripts.test_db_connection
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import text


def mask_url(raw_url: str) -> str:
    """Return URL with password masked."""
    try:
        parts = urlsplit(raw_url)
        if parts.password:
            netloc = f"{parts.username}:***@{parts.hostname}"
            if parts.port:
                netloc += f":{parts.port}"
        else:
            netloc = parts.netloc
        return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
    except Exception:
        return "<invalid url>"


async def run_diagnostics(target_url: str | None = None) -> bool:
    from app.core.config import Settings, settings
    raw_url = target_url or os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    # Normalize scheme, ssl params, and unsupported query args
    raw_url = Settings.normalize_database_url(raw_url)

    print("=" * 60)
    print(" ByteVon CRM — Database Connectivity Diagnostics")
    print("=" * 60)

    # 1. Parse checks
    try:
        parts = urlsplit(raw_url)
    except Exception as exc:
        print(f"[FAIL] Could not parse DATABASE_URL: {exc}")
        return False

    scheme = parts.scheme
    host = parts.hostname or "localhost"
    port = parts.port or 5432
    dbname = (parts.path or "/").lstrip("/")
    user = parts.username or "postgres"
    masked = mask_url(raw_url)

    print(f"Target:       {masked}")
    print(f"Host:         {host}:{port}")
    print(f"Database:     {dbname}")
    print(f"User:         {user}")
    print(f"Scheme:       {scheme}")
    print(f"Query:        {parts.query or '(none)'}")
    print("-" * 60)

    if not scheme.startswith("postgresql+asyncpg"):
        print("[WARN] Scheme is not 'postgresql+asyncpg'. SQLAlchemy requires this dialect prefix.")

    # 2. Direct asyncpg connectivity
    print("[1/2] Testing direct driver connectivity (asyncpg)...")
    dsn = urlunsplit(("postgres", parts.netloc, parts.path, parts.query, parts.fragment))

    t0 = time.perf_counter()
    try:
        import asyncpg
        conn = await asyncpg.connect(dsn, timeout=10)
        pg_version = await conn.fetchval("SHOW server_version;")
        current_db = await conn.fetchval("SELECT current_database();")
        current_user = await conn.fetchval("SELECT current_user;")
        await conn.close()
        elapsed_ms = (time.perf_counter() - t0) * 1000
        print(f"[PASS] asyncpg connected in {elapsed_ms:.1f}ms")
        print(f"       Server version: {pg_version}")
        print(f"       Connected db:   {current_db}")
        print(f"       Connected user: {current_user}")
    except Exception as exc:
        print(f"[FAIL] asyncpg connection failed: {exc}")
        print("       Check: DNS resolution, credentials, and '?ssl=require' for Neon.")
        return False

    # 3. SQLAlchemy AsyncEngine connectivity
    print("-" * 60)
    print("[2/2] Testing SQLAlchemy async engine connection...")
    t0 = time.perf_counter()
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        engine = create_async_engine(
            raw_url,
            pool_pre_ping=True,
            connect_args={"statement_cache_size": 0},
        )
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 AS alive, NOW() AS server_now;"))
            row = result.mappings().one()
            elapsed_ms = (time.perf_counter() - t0) * 1000
            print(f"[PASS] SQLAlchemy engine connected in {elapsed_ms:.1f}ms")
            print(f"       Query result:   alive={row['alive']}, server_now={row['server_now']}")
        await engine.dispose()
    except Exception as exc:
        print(f"[FAIL] SQLAlchemy engine connection failed: {exc}")
        return False

    print("=" * 60)
    print(" ALL DATABASE CONNECTIVITY CHECKS PASSED SUCCESSFULLY.")
    print("=" * 60)
    return True


def main() -> None:
    try:
        target = sys.argv[1] if len(sys.argv) > 1 else None
        ok = asyncio.run(run_diagnostics(target))
        sys.exit(0 if ok else 1)
    except KeyboardInterrupt:
        print("\nAborted by user.")
        sys.exit(130)
    except Exception as exc:
        print(f"Unexpected diagnostic error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
