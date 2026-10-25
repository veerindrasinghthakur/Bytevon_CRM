"""MinIO client for audit archive and document file storage.

When settings.STORAGE_ENABLED is False (the default for the Render prototype),
every storage operation returns None / raises StorageUnavailableError instead of
silently pretending to succeed.

Call sites should handle None / catch StorageUnavailableError and surface a
clear failure to the caller — do NOT substitute a fake success path.
"""

from __future__ import annotations

import logging
from io import BytesIO

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageUnavailableError(RuntimeError):
    """Raised when storage is requested but STORAGE_ENABLED=false."""


def get_minio_client():
    """Return a configured MinIO Minio client instance.

    Raises StorageUnavailableError if storage is disabled.
    """
    if not settings.STORAGE_ENABLED:
        raise StorageUnavailableError(
            "Object storage is disabled (STORAGE_ENABLED=false). "
            "Set STORAGE_ENABLED=true and configure MINIO_* variables to enable."
        )
    from minio import Minio  # lazy import — minio package still installed

    return Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


async def upload_file(
    bucket_name: str,
    object_name: str,
    data: str,
    *,
    content_type: str = "application/jsonl",
) -> str | None:
    """Upload a string payload to MinIO bucket.

    Returns the object path (str) on success.
    Returns None and logs a warning when STORAGE_ENABLED=false.
    Returns None and logs an error on MinIO failure.

    Callers MUST treat None as a failure and NOT proceed with
    operations that depend on the object being stored.
    """
    if not settings.STORAGE_ENABLED:
        logger.warning(
            "upload_file skipped — STORAGE_ENABLED=false "
            "(bucket=%s object=%s). "
            "Configure object storage to persist this data.",
            bucket_name,
            object_name,
        )
        return None

    from minio.error import MinioException  # lazy import

    client = get_minio_client()
    try:
        data_bytes = data.encode("utf-8") if isinstance(data, str) else bytes(data)
        client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=BytesIO(data_bytes),
            length=len(data_bytes),
            content_type=content_type,
        )
        return object_name
    except MinioException as e:
        logger.error("MinIO put_object error (bucket=%s object=%s): %s", bucket_name, object_name, e)
        return None
    except Exception as e:
        logger.exception("Unexpected error during MinIO upload (bucket=%s object=%s): %s", bucket_name, object_name, e)
        return None
