"""ProfileService — profile me / activity / sessions / preferences / avatar."""
from __future__ import annotations

import logging
from datetime import date
from typing import Any
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import NotificationChannel
from app.core.exceptions.exception import DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.profile.repository import ProfileRepository
from app.modules.my_work.profile.schemas import (
    ProfileActivityItem,
    ProfileActivityResponse,
    ProfileMeResponse,
    ProfileMeUpdate,
    ProfilePreferencesResponse,
    ProfilePreferencesUpdate,
)

logger = logging.getLogger(__name__)

AVATAR_BUCKET = "avatars"
AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

_ACTION_ICONS = {
    "CREATE": "add_circle",
    "UPDATE": "edit",
    "APPROVE": "check_circle",
    "REJECT": "cancel",
    "LOGIN": "login",
    "LOGOUT": "logout",
    "ARCHIVE": "archive",
}
_MODULE_LABELS = {
    "LEAVE_REQUEST": "Leave",
    "ATTENDANCE": "Attendance",
    "ATTENDANCE_CORRECTION": "Attendance",
    "APPROVAL_REQUEST": "Approvals",
    "LOGIN": "Security",
    "TASK": "Tasks",
    "PROJECT": "Projects",
    "LEAD": "Sales",
    "CLIENT": "Sales",
    "PAYROLL": "Payroll",
}


class ProfileService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ProfileRepository(session)

    async def get_me(
        self,
        *,
        login_id: int | None = None,
        employment_id: int | None = None,
    ) -> ProfileMeResponse:
        data = await self._repo.get_profile(
            login_id=login_id, employment_id=employment_id
        )
        if not data:
            raise NotFoundError("Profile not found")
        try:
            prefs = await self.get_preferences(
                login_id=data.get("loginId"), employment_id=employment_id
            )
            if prefs.location and not data.get("location"):
                data["location"] = prefs.location
            if prefs.avatarUrl:
                data["avatarUrl"] = prefs.avatarUrl
        except Exception:
            logger.exception("Profile preferences lookup failed")
        return ProfileMeResponse.model_validate(data)

    async def update_me(
        self,
        body: ProfileMeUpdate | dict[str, Any],
        *,
        login_id: int,
    ) -> dict[str, Any]:
        if isinstance(body, ProfileMeUpdate):
            payload = body.model_dump(exclude_unset=True)
        else:
            payload = {k: v for k, v in dict(body).items() if v is not None}
        person = await self._repo.get_person_for_login(login_id)
        if person is None:
            raise NotFoundError("Profile not found")
        name = payload.get("name") or payload.get("display_name")
        if name:
            parts = str(name).strip().split(None, 1)
            person.first_name = parts[0][:100]
            person.last_name = (parts[1] if len(parts) > 1 else "")[:100]
        if payload.get("phone") is not None:
            person.personal_phone = str(payload["phone"])[:20]
        dob = payload.get("dateOfBirth") or payload.get("date_of_birth")
        if dob:
            try:
                person.date_of_birth = date.fromisoformat(str(dob)[:10])
            except ValueError:
                raise DomainError("dateOfBirth must be YYYY-MM-DD")
        await self._commit()
        await self._audit("employment.updated", login_id, None)
        return {"ok": True, **payload}

    async def activity(
        self, *, employment_id: int, limit: int = 20
    ) -> ProfileActivityResponse:
        rows, _ = await self._repo.get_activity(
            employment_id=employment_id, limit=limit
        )
        items: list[ProfileActivityItem] = []
        for log in rows:
            action = log.action.value if hasattr(log.action, "value") else str(log.action)
            ref = log.reference_type.value if hasattr(log.reference_type, "value") else str(log.reference_type or "")
            module = _MODULE_LABELS.get(ref, ref.replace("_", " ").title() or "System")
            created = log.created_at.isoformat() if log.created_at else ""
            items.append(
                ProfileActivityItem(
                    id=f"act-{log.id}",
                    title=action.replace("_", " ").title(),
                    module=module,
                    time=created,
                    status="Done",
                    icon=_ACTION_ICONS.get(action.split("_")[-1], "history"),
                )
            )
        return ProfileActivityResponse(items=items, total=len(items), limit=limit)

    async def list_sessions(self, login_id: int, auth_service: Any) -> list[Any]:
        """Sessions owned by auth module — pass AuthenticationServiceDep."""
        return await auth_service.list_sessions(login_id)

    async def get_preferences(
        self, *, login_id: int | None = None, employment_id: int | None = None
    ) -> ProfilePreferencesResponse:
        from app.modules.notifications.preference.service import PreferenceService

        resp = ProfilePreferencesResponse()
        if login_id is not None:
            pref = await self._repo.get_preferences(login_id)
            if pref is not None:
                resp.language = pref.language or "en"
                resp.theme = pref.theme or "system"
                resp.timezone = pref.timezone
                resp.location = pref.location
                if pref.avatar_object:
                    resp.avatarUrl = self._presigned_avatar_url(pref.avatar_object)
            if employment_id is not None:
                try:
                    prefs = await PreferenceService(self._session).list_preferences(employment_id)
                    by_channel = {p.channel: p.is_enabled for p in prefs}
                    email = by_channel.get(NotificationChannel.EMAIL)
                    inapp = by_channel.get(NotificationChannel.IN_APP)
                    if email is not None:
                        resp.emailNotifications = bool(email)
                    if inapp is not None:
                        resp.desktopPush = bool(inapp)
                except Exception:
                    logger.exception("Notification preferences lookup failed")
        return resp

    async def update_preferences(
        self,
        data: ProfilePreferencesUpdate,
        *,
        login_id: int,
        employment_id: int | None = None,
    ) -> ProfilePreferencesResponse:
        from app.modules.notifications.preference.service import PreferenceService
        from app.modules.notifications.preference.schemas import PreferenceUpdate

        patch = data.model_dump(exclude_unset=True)
        own = {
            k: patch[k]
            for k in ("language", "theme", "timezone", "location")
            if patch.get(k) is not None
        }
        if own:
            await self._repo.upsert_preferences(login_id, **own)
        if employment_id is not None:
            notif = PreferenceService(self._session)
            if patch.get("emailNotifications") is not None:
                await notif.set_preference(
                    employment_id,
                    PreferenceUpdate(
                        channel=NotificationChannel.EMAIL,
                        is_enabled=bool(patch["emailNotifications"]),
                    ),
                )
            if patch.get("desktopPush") is not None:
                await notif.set_preference(
                    employment_id,
                    PreferenceUpdate(
                        channel=NotificationChannel.IN_APP,
                        is_enabled=bool(patch["desktopPush"]),
                    ),
                )
        await self._commit()
        return await self.get_preferences(login_id=login_id, employment_id=employment_id)

    def _presigned_avatar_url(self, obj: str) -> str | None:
        try:
            from app.core.storage.minio import get_minio_client

            return get_minio_client().presigned_get_object(AVATAR_BUCKET, obj)
        except Exception:
            logger.exception("Avatar presign failed")
            return None

    async def upload_avatar(self, file: UploadFile, *, login_id: int) -> dict[str, Any]:
        content_type = (file.content_type or "").lower()
        if content_type not in AVATAR_CONTENT_TYPES:
            raise DomainError("Avatar must be JPEG, PNG, WEBP or GIF")
        blob = await file.read()
        if not blob:
            raise DomainError("Empty file")
        if len(blob) > AVATAR_MAX_BYTES:
            raise DomainError("Avatar must be under 2 MB")
        ext = content_type.split("/")[-1]
        obj = f"{login_id}/{uuid4().hex}.{ext}"
        try:
            from minio.error import MinioException

            from app.core.storage.minio import get_minio_client

            client = get_minio_client()
            try:
                if not client.bucket_exists(AVATAR_BUCKET):
                    client.make_bucket(AVATAR_BUCKET)
            except MinioException:
                logger.exception("Avatar bucket check failed")
            from io import BytesIO

            client.put_object(
                bucket_name=AVATAR_BUCKET,
                object_name=obj,
                data=BytesIO(blob),
                length=len(blob),
                content_type=content_type,
            )
        except Exception as exc:
            logger.exception("Avatar upload failed")
            raise DomainError("Avatar upload failed") from exc
        await self._repo.upsert_preferences(login_id, avatar_object=obj)
        await self._commit()
        return {"ok": True, "avatarUrl": self._presigned_avatar_url(obj)}
