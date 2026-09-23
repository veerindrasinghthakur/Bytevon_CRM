"""Team ORM models."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import ArchiveMixin, Base, IdentityMixin, TimestampMixin


class Team(Base, IdentityMixin, TimestampMixin, ArchiveMixin):
    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    team_head_employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)

    members: Mapped[list[TeamMember]] = relationship(
        "TeamMember", back_populates="team", cascade="all, delete-orphan"
    )


class TeamMember(Base, IdentityMixin):
    """Membership history. Active = is_member TRUE (one active row per person).

    Removing a member flips is_member to FALSE (left_at stamped); re-adding
    inserts a NEW row so the previous entry stays untouched.
    """

    __tablename__ = "team_members"
    __table_args__ = (
        Index(
            "uq_team_members_active",
            "team_id",
            "employment_id",
            unique=True,
            postgresql_where=text("is_member = true"),
        ),
    )

    team_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("teams.id"), nullable=False, index=True
    )
    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    team_role: Mapped[str] = mapped_column(String(100), nullable=False)
    is_member: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    team: Mapped[Team] = relationship("Team", back_populates="members")
