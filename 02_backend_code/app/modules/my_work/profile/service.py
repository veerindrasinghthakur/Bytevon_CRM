"""ProfileService — profile me / activity / sessions."""
from __future__ import annotations

from typing import Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.services.public_service import AuthenticationPublicService
from app.modules.my_work.profile.repository import ProfileRepository
from app.modules.my_work.profile.schemas import (
    ProfileActivityResponse,
    ProfileMeResponse,
    ProfileMeUpdate,
)


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ProfileRepository(session)
        self._auth = AuthenticationPublicService(session)

    async def get_me(
        self,
        *,
        login_id: Optional[int] = None,
        employment_id: Optional[int] = None,
    ) -> ProfileMeResponse:
        data = await self._repo.get_profile_stub(
            login_id=login_id, employment_id=employment_id
        )
        return ProfileMeResponse.model_validate(data)

    async def update_me(self, body: ProfileMeUpdate | dict[str, Any]) -> dict[str, Any]:
        if isinstance(body, ProfileMeUpdate):
            payload = body.model_dump(exclude_unset=True)
        else:
            payload = dict(body)
        return {"ok": True, **payload}

    async def activity(self, *, limit: int = 20) -> ProfileActivityResponse:
        return ProfileActivityResponse(limit=limit)

    async def list_sessions(self, login_id: int) -> List[Any]:
        return await self._auth.list_sessions(login_id)
