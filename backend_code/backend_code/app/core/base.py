"""
Shared SQLAlchemy base, naming conventions, and reusable mixins.

Every ORM model inherits from `Base` plus the appropriate mixins.
Aligned with Complete_Final_Schema.md and architecture conventions:
- INT primary keys (Identity)
- Archive instead of hard-delete
- Effective dating for versioned config
- Audit columns where applicable
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Identity,
    Integer,
    MetaData,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# ---------------------------------------------------------------------
# Naming Convention (Alembic / constraint friendly)
# ---------------------------------------------------------------------

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


# ---------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------

class Base(DeclarativeBase):
    """Declarative base for all ORM models."""

    metadata = metadata


# ---------------------------------------------------------------------
# Mixins
# ---------------------------------------------------------------------

class IdentityMixin:
    """Standard integer primary key (schema: INT AUTO_INCREMENT)."""

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=False),
        primary_key=True,
        comment="Primary key",
    )


class TimestampMixin:
    """created_at / updated_at with server defaults."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Record creation timestamp",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Last update timestamp",
    )


class CreatedAtMixin:
    """Only created_at (for append-only / ledger tables)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Record creation timestamp",
    )


class AuditActorMixin:
    """
    changed_by / created_by style actor columns.
    Stored as Integer (employment id). System actions use reserved SYSTEM_EMPLOYMENT_ID.
    No actor_type column per locked architecture decision.
    """

    created_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Employment ID who created this record (or SYSTEM_EMPLOYMENT_ID)",
    )


class ChangedByMixin:
    """changed_by only (common on master + history tables)."""

    changed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Employment ID who last changed this record (or SYSTEM_EMPLOYMENT_ID)",
    )


class ArchiveMixin:
    """Soft-archive support. Prefer archive over hard DELETE."""

    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        comment="Whether this record has been archived",
    )

    archived_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Archive timestamp",
    )

    archived_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="Employment ID who archived this record",
    )


class EffectiveDatingMixin:
    """
    Versioned configuration pattern.
    Never overwrite; close previous row (set effective_to) and insert new.
    """

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Date from which this version becomes effective",
    )

    effective_to: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        comment="Date until which this version is effective (NULL = current)",
    )
