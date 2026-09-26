#!/bin/sh
set -eu

echo "========================================"
echo " ByteVon CRM backend initialization"
echo "========================================"

echo "[1/6] Waiting for PostgreSQL..."

python - <<'PY'
import asyncio
import os
import sys
from urllib.parse import urlsplit, urlunsplit

import asyncpg

raw_url = os.environ["DATABASE_URL"]
# asyncpg.connect() needs a plain postgres DSN, not the SQLAlchemy
# "postgresql+asyncpg://" dialect URL used by the app itself.
parts = urlsplit(raw_url)
dsn = urlunsplit(("postgres", parts.netloc, parts.path, parts.query, parts.fragment))

async def wait_for_db():
    for attempt in range(60):
        try:
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

echo "[2/6] Running database migrations..."
alembic upgrade head

echo "[3/6] Running bootstrap seed..."
python -m scripts.seed_bootstrap

echo "[4/6] Running test/demo seed..."
python -m scripts.seed_test_data

echo "[5/6] Ensuring MinIO buckets (audit-archives, notification-attachments, avatars)..."

python - <<'PY'
import logging
import time

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("minio-init")

BUCKETS = ("audit-archives", "notification-attachments", "avatars")

try:
    from app.core.storage.minio import get_minio_client
except Exception as exc:
    print(f"WARNING: MinIO client unavailable, skipping bucket init: {exc}")
else:
    client = get_minio_client()
    for attempt in range(30):
        try:
            for bucket in BUCKETS:
                try:
                    if client.bucket_exists(bucket):
                        print(f"Bucket exists: {bucket}")
                    else:
                        client.make_bucket(bucket)
                        print(f"Bucket created: {bucket}")
                except Exception as exc:
                    # Already exists (race) or other error: log and continue
                    # so startup never fails merely because a bucket exists.
                    print(f"Bucket {bucket}: continuing after error: {exc}")
            print("MinIO bucket initialization complete.")
            break
        except Exception as exc:
            print(f"MinIO not ready ({attempt + 1}/30): {exc}")
            time.sleep(2)
    else:
        print("WARNING: MinIO never became ready; continuing without bucket init.")
PY

echo "[6/6] Starting FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
