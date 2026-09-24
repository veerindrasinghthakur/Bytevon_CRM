"""Profile repository — person/login/employment reads + preferences."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base_repository import BaseRepository
from app.modules.admin.audit.models import AuditLog
from app.modules.auth.models.authentication_models import Login, Person
from app.modules.my_work.profile.models import UserPreference
from app.modules.workforce.department.models import Department
from app.modules.workforce.models.employment_models import (
    Employment,
    EmploymentAssignment,
    Position,
)


class ProfileRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_profile(
        self, *, login_id: int | None = None, employment_id: int | None = None
    ) -> dict[str, Any]:
        """Joined identity + employment snapshot for the caller's own login."""
        stmt = (
            select(
                Login.id,
                Employment.id,
                Person.first_name,
                Person.last_name,
                Login.email,
                Person.personal_phone,
                Person.date_of_birth,
                Person.address,
                Employment.employee_code,
                Employment.employment_type,
                Employment.current_state,
                Employment.joining_date,
                Department.name,
                Position.name,
                EmploymentAssignment.work_mode,
                Department.department_head_employment_id,
            )
            .join(Person, Person.id == Login.person_id)
            .join(Employment, Employment.person_id == Person.id)
            .join(
                EmploymentAssignment,
                (EmploymentAssignment.employment_id == Employment.id)
                & (EmploymentAssignment.effective_to.is_(None)),
                isouter=True,
            )
            .join(Department, Department.id == EmploymentAssignment.department_id, isouter=True)
            .join(Position, Position.id == EmploymentAssignment.position_id, isouter=True)
            .order_by(Employment.id)
        )
        if employment_id is not None:
            stmt = stmt.where(Employment.id == employment_id)
        elif login_id is not None:
            stmt = stmt.where(Login.id == login_id)
        else:
            return {}
        res = await self.execute(stmt)
        row = res.first()
        if row is None:
            return {}
        dob = row[6]
        joined = row[11]
        manager = ""
        head_id = row[15]
        if head_id:
            manager = await self._person_name_for_employment(int(head_id))
        return {
            "loginId": row[0],
            "employmentId": row[1],
            "name": f"{row[2] or ''} {row[3] or ''}".strip(),
            "email": row[4] or "",
            "phone": row[5] or "",
            "dateOfBirth": dob.isoformat() if dob else None,
            "location": row[7] or "",
            "employeeCode": row[8] or "",
            "employmentType": row[9].value if hasattr(row[9], "value") else str(row[9] or ""),
            "employmentState": row[10].value if hasattr(row[10], "value") else str(row[10] or ""),
            "joiningDate": joined.isoformat() if isinstance(joined, date) else None,
            "department": row[12] or "",
            "position": row[13] or "",
            "title": row[13] or "",
            "workMode": row[14].value if hasattr(row[14], "value") else str(row[14] or ""),
            "managerName": manager,
        }

    async def _person_name_for_employment(self, employment_id: int) -> str:
        stmt = (
            select(Person.first_name, Person.last_name)
            .join(Employment, Employment.person_id == Person.id)
            .where(Employment.id == employment_id)
        )
        res = await self.execute(stmt)
        row = res.one_or_none()
        if row is None:
            return ""
        return f"{row[0] or ''} {row[1] or ''}".strip()

    async def get_person_for_login(self, login_id: int) -> Person | None:
        stmt = (
            select(Person)
            .join(Login, Login.person_id == Person.id)
            .where(Login.id == login_id)
        )
        return await self.scalar_one_or_none(stmt)

    async def get_activity(
        self, *, employment_id: int, limit: int = 20
    ) -> tuple[list[AuditLog], int]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.employment_id == employment_id)
            .order_by(desc(AuditLog.id))
            .limit(limit)
        )
        rows = list(await self.scalars(stmt))
        return rows, len(rows)

    async def get_preferences(self, login_id: int) -> UserPreference | None:
        stmt = select(UserPreference).where(UserPreference.login_id == login_id)
        return await self.scalar_one_or_none(stmt)

    async def upsert_preferences(
        self, login_id: int, **fields: Any
    ) -> UserPreference:
        pref = await self.get_preferences(login_id)
        if pref is None:
            pref = UserPreference(login_id=login_id)
            await self.add(pref)
            await self._session.flush()
        for key, value in fields.items():
            if value is not None and hasattr(pref, key):
                setattr(pref, key, value)
        return pref
