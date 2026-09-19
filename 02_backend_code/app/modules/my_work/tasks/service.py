"""My Work Tasks Service."""
from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.tasks.repository import MyWorkTasksRepository
from app.modules.my_work.tasks.schemas import MyTaskListResponse


class MyWorkTasksService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkTasksRepository(session)

    async def list_my_tasks(
        self,
        employment_id: Optional[int] = None,
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 1,
    ) -> MyTaskListResponse:
        page = max(1, offset)
        page_size = max(1, limit)
        return MyTaskListResponse(items=[], total=0, page=page, pageSize=page_size)
