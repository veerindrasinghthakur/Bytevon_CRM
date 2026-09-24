"""Concrete data boundary produced by ScopeResolver."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ScopeConstraint(BaseModel):
    """
    Resolved visibility / create boundary for one resource (+ action).

    Lists are UNION of all matching grants for the actor — never collapsed
    to a single "broadest" scope. organization_wide=True means unrestricted
    within the org (narrower ID lists are informational / redundant).
    """

    resource: str
    organization_id: Optional[int] = None
    department_ids: List[int] = Field(default_factory=list)
    location_ids: List[int] = Field(default_factory=list)
    team_ids: List[int] = Field(default_factory=list)
    employment_ids: List[int] = Field(default_factory=list)
    organization_wide: bool = False

    @property
    def has_access(self) -> bool:
        if self.organization_wide:
            return True
        return bool(
            self.department_ids
            or self.location_ids
            or self.team_ids
            or self.employment_ids
        )
