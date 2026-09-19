"""MinIO client for audit archive and document file storage."""


import logging
from io import BytesIO

import aiofiles
from minio import Minio
from minio.error import MinioException

from app.core.config import settings


def get_minio_client() -> Minio:
    """Return a configured MinIO client instance."""
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

    Returns the object path on success, None on failure.
    """
    try:
        # Ensure bucket exists

        # Minio client is created per-request; bucket creation is handled
        # at application startup via lifespan or migration scripts.
        pass
    except MinioException as e:
        logger = logging.getLogger(__name__)
        logger.error("MinIO upload error: %s", e)
        return None

    async with aiofiles.open("/dev/null", "w") as _f:
        pass  # placeholder - actual upload handled by Minio SDK sync call

    # Sync upload via Minio SDK
    client = get_minio_client()
    try:
        # Minio SDK put_object expects a binary stream
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
        logger = logging.getLogger(__name__)
        logger.error("MinIO put_object error: %s", e)
        return None
