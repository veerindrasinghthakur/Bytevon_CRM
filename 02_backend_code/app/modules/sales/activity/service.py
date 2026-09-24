"""ActivityService — recent sales activity feed (audit-backed, human-readable)."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.enums import AuditAction, AuditReferenceType
from app.core.services.base_public_service import BasePublicService
from app.modules.admin.audit.models import AuditLog
from app.modules.sales.activity.repository import ActivityRepository

_ACTION_KIND = {
    AuditAction.CREATE: "lead_created",
    AuditAction.UPDATE: "lead_updated",
    AuditAction.STATUS_CHANGE: "status_changed",
    AuditAction.ARCHIVE: "lead_deleted",
}


class ActivityService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = ActivityRepository(session)

    async def _actor_names(self, employment_ids: set[int]) -> dict[int, str]:
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
        return {e.id: names.get(e.person_id) or e.employee_code for e in emp_list}

    async def _lead_titles(self, lead_ids: set[int]) -> dict[int, str]:
        from app.modules.sales.models import Lead

        ids = {i for i in lead_ids if i}
        if not ids:
            return {}
        rows = (
            await self._session.execute(select(Lead).where(Lead.id.in_(ids)))
        ).scalars()
        return {r.id: r.lead_title for r in rows}

    def _readable_text(self, kind: str, lead_title: str, description: str) -> str:
        name = f"'{lead_title}'" if lead_title else "lead"
        if kind == "lead_created":
            return f"Lead {name} was created"
        if kind == "lead_won":
            return f"Lead {name} was won"
        if kind == "lead_deleted":
            return f"Lead {name} was deleted"
        if kind == "status_changed":
            # Descriptions carry "… from X to Y" when written by lead service.
            detail = description.replace("Status changed", "").strip()
            return f"Lead {name} status changed{(' ' + detail) if detail else ''}".strip()
        return f"Lead {name} was updated"

    async def list_recent(
        self, *, limit: int = 10, lead_id: int | None = None
    ) -> list[dict[str, Any]]:
        logs_stmt = (
            select(AuditLog)
            .where(AuditLog.reference_type == AuditReferenceType.LEAD)
            .order_by(AuditLog.created_at.desc())
            .limit(max(limit, 50))
        )
        if lead_id is not None:
            logs_stmt = logs_stmt.where(AuditLog.reference_id == lead_id)
        logs = list((await self._session.execute(logs_stmt)).scalars().all())

        if logs:
            actors = await self._actor_names({l.employment_id for l in logs if l.employment_id})
            titles = await self._lead_titles({l.reference_id for l in logs})
            out: list[dict[str, Any]] = []
            for l in logs[:limit]:
                action = l.action.value if hasattr(l.action, "value") else str(l.action)
                kind = _ACTION_KIND.get(l.action, "lead_updated")
                if "won" in (l.description or "").lower() or action == "WON":
                    kind = "lead_won"
                title = titles.get(l.reference_id, "")
                out.append(
                    {
                        "id": f"audit-{l.id}",
                        "kind": kind,
                        "lead_id": l.reference_id,
                        "lead_title": title,
                        "action": action,
                        "text": self._readable_text(kind, title, l.description or ""),
                        "actor": actors.get(l.employment_id or 0, "System"),
                        "actor_employment_id": l.employment_id,
                        "time": l.created_at.isoformat() if l.created_at else "",
                        "type": "lead",
                    }
                )
            return out

        # Fallback for data predating audit writes: derive from recent leads.
        leads = await self._repo.recent_leads(limit=max(limit, 20))
        out = []
        for r in leads[:limit]:
            if lead_id is not None and r.id != lead_id:
                continue
            st = r.status.value if hasattr(r.status, "value") else str(r.status)
            out.append(
                {
                    "id": f"lead-{r.id}",
                    "kind": "lead_updated",
                    "lead_id": r.id,
                    "lead_title": r.lead_title,
                    "action": "UPDATE",
                    "text": f"Lead '{r.lead_title}' — {st}",
                    "actor": "System",
                    "actor_employment_id": None,
                    "time": r.updated_at.isoformat() if r.updated_at else "",
                    "type": "lead",
                }
            )
        return out
