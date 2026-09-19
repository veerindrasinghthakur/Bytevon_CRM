"""My Work Tasks Service."""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.tasks.repository import MyWorkTasksRepository
from app.modules.my_work.tasks.schemas import MyTask, MyTaskListResponse


class MyWorkTasksService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkTasksRepository(session)

    async def list_my_tasks(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20, offset: int = 1
    ) -> MyTaskListResponse:
        items = await self._repo.list_my_tasks(
            employment_id, status=status, search=search, limit=limit, offset=offset
        )
        total = await self._repo.count_my_tasks(employment_id, status=status, search=search)
        return MyTaskListResponse(
            items=[MyTask.model_validate(i) for i in items],
            total=total,
            page=offset,
            pageSize=limit,
        )