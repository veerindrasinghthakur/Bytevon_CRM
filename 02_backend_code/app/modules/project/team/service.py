"""TeamService — team CRUD and membership."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions.exception import ConflictError, DomainError, NotFoundError
from app.core.services.base_public_service import BasePublicService
from app.modules.project.team.models import Team, TeamMember
from app.modules.project.team.repository import TeamRepository
from app.modules.project.team.schemas import (
    MessageResponse,
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
)

logger = logging.getLogger(__name__)


class TeamService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = TeamRepository(session)

    async def _require_employment(
        self, employment_id: int, *, label: str = "Employment"
    ) -> None:
        from app.modules.workforce.models import Employment

        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            raise NotFoundError(f"{label} not found (id={employment_id})")

    async def _team_response(self, team: Team) -> TeamResponse:
        await self._session.refresh(team)
        return TeamResponse.model_validate(team)

    async def _member_response(self, member: TeamMember) -> TeamMemberResponse:
        await self._session.refresh(member)
        return TeamMemberResponse.model_validate(member)

    async def create_team(
        self,
        data: TeamCreate,
        *,
        actor_employment_id: int | None = None,
    ) -> TeamResponse:
        if not data.name or not str(data.name).strip():
            raise DomainError("Team name is required")

        await self._require_employment(
            data.team_head_employment_id, label="Team head employment"
        )

        team = Team(
            name=str(data.name).strip(),
            team_head_employment_id=data.team_head_employment_id,
            description=data.description,
            changed_by=actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID,
        )
        await self._repo.add(team)
        await self._flush()

        existing = await self._repo.get_active_member(
            team.id, data.team_head_employment_id
        )
        if existing is None:
            hist = (
                await self._session.execute(
                    select(TeamMember).where(
                        TeamMember.team_id == team.id,
                        TeamMember.employment_id == data.team_head_employment_id,
                    )
                )
            ).scalar_one_or_none()
            if hist is not None:
                hist.left_at = None
                hist.team_role = "Team Head"
            else:
                await self._repo.add(
                    TeamMember(
                        team_id=team.id,
                        employment_id=data.team_head_employment_id,
                        team_role="Team Head",
                    )
                )

        await self._commit()
        await self._audit("team.created", team.id, actor_employment_id)
        return await self._team_response(team)

    async def list_teams(self) -> list[TeamResponse]:
        rows = await self._repo.list_teams()
        return [TeamResponse.model_validate(r) for r in rows]

    async def get_team(self, team_id: int) -> TeamResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        return TeamResponse.model_validate(team)

    async def update_team(
        self,
        team_id: int,
        data: TeamUpdate,
        *,
        actor_employment_id: int | None = None,
    ) -> TeamResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        payload = data.model_dump(exclude_unset=True)
        if (
            "team_head_employment_id" in payload
            and payload["team_head_employment_id"] is not None
        ):
            await self._require_employment(
                int(payload["team_head_employment_id"]),
                label="Team head employment",
            )
        for field, value in payload.items():
            setattr(team, field, value)
        team.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("team.updated", team.id, actor_employment_id)
        return await self._team_response(team)

    async def add_team_member(
        self,
        team_id: int,
        data: TeamMemberAdd,
        *,
        actor_employment_id: int | None = None,
    ) -> TeamMemberResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        await self._require_employment(data.employment_id, label="Member employment")
        existing = await self._repo.get_active_member(team_id, data.employment_id)
        if existing:
            raise ConflictError("Employment is already an active member of this team")

        hist = (
            await self._session.execute(
                select(TeamMember).where(
                    TeamMember.team_id == team_id,
                    TeamMember.employment_id == data.employment_id,
                )
            )
        ).scalar_one_or_none()
        if hist is not None:
            hist.left_at = None
            hist.team_role = data.team_role
            member = hist
        else:
            member = TeamMember(
                team_id=team_id,
                employment_id=data.employment_id,
                team_role=data.team_role,
            )
            await self._repo.add(member)

        await self._commit()
        await self._audit("team.member_added", team_id, actor_employment_id)
        return await self._member_response(member)

    async def remove_team_member(
        self,
        team_id: int,
        employment_id: int,
        *,
        actor_employment_id: int | None = None,
    ) -> MessageResponse:
        member = await self._repo.get_active_member(team_id, employment_id)
        if member is None:
            raise NotFoundError("Active team membership not found")
        member.left_at = datetime.now(UTC)
        await self._commit()
        await self._audit("team.member_removed", team_id, actor_employment_id)
        return MessageResponse(message="Team member removed")

    async def list_team_members(self, team_id: int) -> list[TeamMemberResponse]:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        rows = await self._repo.list_active_members(team_id)
        return [TeamMemberResponse.model_validate(r) for r in rows]
