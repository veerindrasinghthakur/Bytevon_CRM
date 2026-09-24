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
from app.modules.project.project.repository import ProjectRepository
from app.modules.project.project.schemas import ProjectResponse
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
        self._project_repo = ProjectRepository(session)

    async def _require_employment(
        self, employment_id: int, *, label: str = "Employment"
    ) -> None:
        from app.modules.workforce.models import Employment

        emp = await self._session.get(Employment, employment_id)
        if emp is None:
            raise NotFoundError(f"{label} not found (id={employment_id})")

    async def _team_response(self, team: Team) -> TeamResponse:
        await self._session.refresh(team)
        enriched = await self._enrich_teams([team])
        return enriched[0]

    async def _member_response(self, member: TeamMember) -> TeamMemberResponse:
        await self._session.refresh(member)
        resp = TeamMemberResponse.model_validate(member)
        enriched = await self._enrich_members([member])
        if enriched:
            return enriched[0]
        return resp

    async def _person_info(
        self, employment_ids: set[int]
    ) -> dict[int, tuple[str, str]]:
        """employment_id → (display name, employee code), batched."""
        from app.modules.auth.models import Person
        from app.modules.workforce.models import Employment

        ids = {i for i in employment_ids if i}
        if not ids:
            return {}
        emps = (
            await self._session.execute(select(Employment).where(Employment.id.in_(ids)))
        ).scalars()
        emp_list = list(emps)
        persons = (
            await self._session.execute(
                select(Person).where(Person.id.in_({e.person_id for e in emp_list}))
            )
        ).scalars()
        names = {p.id: f"{p.first_name} {p.last_name}".strip() for p in persons}
        out: dict[int, tuple[str, str]] = {}
        for e in emp_list:
            out[e.id] = (names.get(e.person_id) or e.employee_code, e.employee_code)
        return out

    async def _department_names(
        self, employment_ids: set[int]
    ) -> dict[int, str]:
        """employment_id → current department name, batched."""
        from datetime import date as _date

        from app.modules.workforce.department.models import Department
        from app.modules.workforce.models import EmploymentAssignment

        ids = {i for i in employment_ids if i}
        if not ids:
            return {}
        today = _date.today()
        rows = (
            await self._session.execute(
                select(EmploymentAssignment).where(
                    EmploymentAssignment.employment_id.in_(ids),
                    EmploymentAssignment.effective_from <= today,
                    (EmploymentAssignment.effective_to.is_(None))
                    | (EmploymentAssignment.effective_to >= today),
                )
            )
        ).scalars()
        dept_by_emp: dict[int, int] = {}
        for a in rows:
            if a.department_id is not None and a.employment_id not in dept_by_emp:
                dept_by_emp[a.employment_id] = int(a.department_id)
        if not dept_by_emp:
            return {}
        depts = (
            await self._session.execute(
                select(Department).where(Department.id.in_(set(dept_by_emp.values())))
            )
        ).scalars()
        names = {d.id: d.name for d in depts}
        return {e: names.get(d, "—") for e, d in dept_by_emp.items()}

    async def _enrich_members(
        self, rows: list[TeamMember]
    ) -> list[TeamMemberResponse]:
        emp_ids = {r.employment_id for r in rows}
        info = await self._person_info(emp_ids)
        depts = await self._department_names(emp_ids)
        out: list[TeamMemberResponse] = []
        for r in rows:
            resp = TeamMemberResponse.model_validate(r)
            name, code = info.get(r.employment_id, (f"Emp #{r.employment_id}", ""))
            resp.person_name = name
            resp.employee_code = code or None
            resp.department_name = depts.get(r.employment_id)
            out.append(resp)
        return out

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

        # Head-only at creation; members are added later via the add-members flow.
        existing = await self._repo.get_active_member(
            team.id, data.team_head_employment_id
        )
        if existing is None:
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

    async def _enrich_teams(self, teams: list[Team]) -> list[TeamResponse]:
        head_ids = {t.team_head_employment_id for t in teams if t.team_head_employment_id}
        info = await self._person_info(head_ids)
        depts = await self._department_names(head_ids)
        out: list[TeamResponse] = []
        for t in teams:
            resp = TeamResponse.model_validate(t)
            if t.team_head_employment_id:
                name, _ = info.get(
                    t.team_head_employment_id,
                    (f"Emp #{t.team_head_employment_id}", ""),
                )
                resp.head_name = name
                resp.department_name = depts.get(t.team_head_employment_id)
            resp.member_count = await self._repo.count_active_members(t.id)
            resp.project_count = await self._project_repo.count_projects_for_team(t.id)
            out.append(resp)
        return out

    async def list_teams(self) -> list[TeamResponse]:
        rows = list(await self._repo.list_teams())
        return await self._enrich_teams(rows)

    async def get_team(self, team_id: int) -> TeamResponse:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        enriched = await self._enrich_teams([team])
        return enriched[0]

    async def delete_team(
        self, team_id: int, *, actor_employment_id: int | None = None
    ) -> MessageResponse:
        """Soft-delete a team (is_archived=true); members/history stay intact."""
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        team.is_archived = True
        team.archived_at = datetime.now(UTC)
        team.changed_by = actor_employment_id or settings.SYSTEM_EMPLOYMENT_ID
        await self._commit()
        await self._audit("team.deleted", team.id, actor_employment_id)
        return MessageResponse(message="Team deleted")

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

        # Re-add always inserts a NEW row; previous entries stay untouched.
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
        # Soft remove: keep the record for history (is_member=false).
        member.is_member = False
        member.left_at = datetime.now(UTC)
        await self._commit()
        await self._audit("team.member_removed", team_id, actor_employment_id)
        return MessageResponse(message="Team member removed")

    async def list_team_members(self, team_id: int) -> list[TeamMemberResponse]:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        rows = list(await self._repo.list_active_members(team_id))
        return await self._enrich_members(rows)

    async def list_member_history(self, team_id: int) -> list[TeamMemberResponse]:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        rows = list(await self._repo.list_member_history(team_id))
        return await self._enrich_members(rows)

    async def list_projects_for_team(self, team_id: int) -> list[ProjectResponse]:
        team = await self._repo.get_team_by_id(team_id)
        if team is None:
            raise NotFoundError("Team not found")
        rows = await self._project_repo.list_projects_for_team(team_id)
        return [ProjectResponse.model_validate(r) for r in rows]
