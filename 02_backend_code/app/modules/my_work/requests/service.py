"""My Work Requests Service."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.requests.repository import MyWorkRequestsRepository
from app.modules.my_work.requests.schemas import RequestListResponse


class MyWorkRequestsService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkRequestsRepository(session)

    async def list_my_requests(
        self,
        employment_id: int | None = None,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 20,
    ) -> RequestListResponse:
        return RequestListResponse(items=[], total=0, page=1, pageSize=max(1, limit))
