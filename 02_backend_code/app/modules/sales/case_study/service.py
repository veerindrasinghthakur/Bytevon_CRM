"""CaseStudyService — V1 list stub."""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.services.base_public_service import BasePublicService
from app.modules.sales.case_study.repository import CaseStudyRepository


class CaseStudyService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = CaseStudyRepository(session)

    async def list(
        self,
        *,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        items = await self._repo.list_all()
        return {
            "items": items,
            "total": 0,
            "page": page,
            "pageSize": page_size,
            "metrics": [
                {"id": "total", "label": "Case studies", "value": "0"},
                {"id": "published", "label": "Published", "value": "0"},
            ],
        }
