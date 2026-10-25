#!/bin/sh
set -eu

# ---------------------------------------------------------------------------
# ByteVon CRM backend entrypoint.
#
# STARTUP_MODE controls what happens at container start:
#
#   app          (default) — Wait for DB, then start Uvicorn only.
#                            No migrations, no seeding. Steady-state mode for Render.
#
#   init         — Wait for DB, run migrations (alembic upgrade head), run
#                  bootstrap seed, run demo seed, then exit 0.
#                  Run locally via docker run against Neon before first deployment.
#
#   init_and_app — Wait for DB, run migrations, run seeds, then start Uvicorn.
#                  Controlled first-start mode for Render Free Web Services when
#                  local Docker is not used. Switch to 'app' after initial start.
#
#   compose      — Wait for DB and MinIO, run migrations, run seeds,
#                  initialise MinIO buckets, then start Uvicorn.
#                  Original Docker Compose local-dev flow.
#
# Set via: STARTUP_MODE=init  (environment variable)
# ---------------------------------------------------------------------------

STARTUP_MODE="${STARTUP_MODE:-app}"

echo "========================================"
echo " ByteVon CRM backend  [mode: ${STARTUP_MODE}]"
echo "========================================"

# ---------------------------------------------------------------------------
# Helper: wait for PostgreSQL to accept connections.
# Converts SQLAlchemy postgresql+asyncpg:// URL to a plain postgres:// DSN
# that asyncpg.connect() accepts directly.
# ---------------------------------------------------------------------------
wait_for_postgres() {
    echo "[db-wait] Waiting for PostgreSQL..."
    python - <<'PY'
import asyncio
import os
import sys
from urllib.parse import urlsplit, urlunsplit

raw_url = os.environ["DATABASE_URL"]
# Strip the SQLAlchemy dialect prefix and any SSL query param fragments
# so asyncpg.connect() gets a plain postgres DSN.
parts = urlsplit(raw_url)
# Replace postgresql+asyncpg:// with postgres:// for asyncpg
dsn = urlunsplit(("postgres", parts.netloc, parts.path, parts.query, parts.fragment))

async def wait_for_db():
    for attempt in range(60):
        try:
            import asyncpg
            conn = await asyncpg.connect(dsn)
            await conn.close()
            print("PostgreSQL is ready.")
            return
        except Exception as exc:
            print(f"PostgreSQL not ready ({attempt + 1}/60): {exc}")
            await asyncio.sleep(2)

    print("PostgreSQL did not become ready in time.", file=sys.stderr)
    sys.exit(1)

asyncio.run(wait_for_db())
PY
}

# ---------------------------------------------------------------------------
# Helper: run Alembic migrations.
# ---------------------------------------------------------------------------
run_migrations() {
    echo "[migrate] Running alembic upgrade head..."
    alembic upgrade head
    echo "[migrate] Migrations complete."
}

# ---------------------------------------------------------------------------
# Helper: run bootstrap + demo seeds.
# ---------------------------------------------------------------------------
run_seeds() {
    echo "[seed] Running bootstrap seed..."
    python -m scripts.seed_bootstrap
    echo "[seed] Running demo data seed..."
    python -m scripts.seed_test_data
    echo "[seed] Seeding complete."
}

# ---------------------------------------------------------------------------
# Helper: initialise MinIO buckets (local Compose only).
# Non-fatal: logs a warning and continues if MinIO is unavailable.
# ---------------------------------------------------------------------------
init_minio_buckets() {
    echo "[minio] Ensuring MinIO buckets (audit-archives, notification-attachments, avatars)..."
    python - <<'PY'
import logging
import time

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("minio-init")

BUCKETS = ("audit-archives", "notification-attachments", "avatars")

try:
    from app.core.storage.minio import get_minio_client
except Exception as exc:
    log.warning("MinIO client unavailable, skipping bucket init: %s", exc)
else:
    client = get_minio_client()
    for attempt in range(30):
        try:
            for bucket in BUCKETS:
                try:
                    if client.bucket_exists(bucket):
                        log.info("Bucket exists: %s", bucket)
                    else:
                        client.make_bucket(bucket)
                        log.info("Bucket created: %s", bucket)
                except Exception as exc:
                    log.warning("Bucket %s: continuing after error: %s", bucket, exc)
            log.info("MinIO bucket initialisation complete.")
            break
        except Exception as exc:
            log.warning("MinIO not ready (%d/30): %s", attempt + 1, exc)
            time.sleep(2)
    else:
        log.warning("MinIO never became ready; continuing without bucket init.")
PY
}

# ---------------------------------------------------------------------------
# Helper: start Uvicorn.
# Binds to 0.0.0.0 and respects the PORT env var (Render sets this).
# Falls back to 8000 for local Docker Compose.
# ---------------------------------------------------------------------------
start_uvicorn() {
    PORT="${PORT:-8000}"
    echo "[uvicorn] Starting FastAPI on 0.0.0.0:${PORT}..."
    exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
}

# ---------------------------------------------------------------------------
# Custom command override:
# If arguments were provided to `docker run` (e.g. `docker run ... python -m scripts.init_db`),
# execute them directly instead of running mode dispatch.
# ---------------------------------------------------------------------------
if [ "$#" -gt 0 ]; then
    echo "[entrypoint] Executing custom command: $*"
    exec "$@"
fi

# ---------------------------------------------------------------------------
# Mode dispatch
# ---------------------------------------------------------------------------
case "${STARTUP_MODE}" in

  init)
    # One-time initialisation: migrate + seed, then exit.
    # Run this once locally via Docker against Neon before deploying 'app' mode.
    wait_for_postgres
    run_migrations
    run_seeds
    echo "[init] Initialisation complete. Container exiting."
    exit 0
    ;;

  init_and_app)
    # Controlled first-start mode for Render Free Web Services:
    # Run migrations and seeding once, then immediately launch the API server.
    # After first successful deployment, switch STARTUP_MODE to 'app' in Render dashboard
    # to avoid repeating seed checks on routine restarts.
    wait_for_postgres
    run_migrations
    run_seeds
    start_uvicorn
    ;;

  compose)
    # Full local Docker Compose flow (original behaviour preserved).
    wait_for_postgres
    run_migrations
    run_seeds
    init_minio_buckets
    start_uvicorn
    ;;

  app|*)
    # Default Render deployment: only wait for DB connectivity, then start.
    # Migrations and seeding must have been run via STARTUP_MODE=init first.
    wait_for_postgres
    start_uvicorn
    ;;

esac
