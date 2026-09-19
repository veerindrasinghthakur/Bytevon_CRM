"""TeamRepository — team and team-member queries."""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.project.team.models import Team, TeamMember


class TeamRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_team_by_id(self, team_id: int) -> Team | None:
        stmt = select(Team).where(Team.id == team_id)
        return await self.scalar_one_or_none(stmt)

    async def list_teams(self) -> Sequence[Team]:
        stmt = select(Team).order_by(Team.name)
        return (await self._session.execute(stmt)).scalars().all()

    async def get_active_member(
        self, team_id: int, employment_id: int
    ) -> TeamMember | None:
        stmt = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.employment_id == employment_id,
            TeamMember.left_at.is_(None),
        )
        return await self.scalar_one_or_none(stmt)

    async def list_active_members(self, team_id: int) -> Sequence[TeamMember]:
        stmt = select(TeamMember).where(
            TeamMember.team_id == team_id, TeamMember.left_at.is_(None)
        )
        return (await self._session.execute(stmt)).scalars().all()

    async def count_active_members(self, team_id: int) -> int:
        stmt = select(func.count()).select_from(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.left_at.is_(None),
        )
        return int((await self._session.execute(stmt)).scalar_one() or 0)
