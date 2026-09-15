"""Profile repository — placeholder for person/login reads."""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession


class ProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_profile_stub(
        self,
        *,
        login_id: Optional[int] = None,
        employment_id: Optional[int] = None,
    ) -> dict[str, Any]:
        return {
            "loginId": login_id,
            "employmentId": employment_id,
            "name": "",
            "email": "",
            "avatarUrl": None,
            "title": "",
            "department": "",
            "phone": "",
        }
