"""Notification drafts table.

Revision ID: r8s9t0u1v2w3
"""

from __future__ import annotations

from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "r8s9t0u1v2w3"
down_revision: Union[str, None] = "q7r8s9t0u1v2"


def upgrade() -> None:
    op.create_table(
        "notification_drafts",
        sa.Column("owner_employment_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False, server_default=""),
        sa.Column("body", sa.Text(), nullable=False, server_default=""),
        sa.Column("priority", sa.String(20), nullable=False, server_default="Normal"),
        sa.Column("module_ctx", sa.String(100), nullable=False, server_default=""),
        sa.Column("broadcast_all", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("roles", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("employment_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("channels", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("template_code", sa.String(100), nullable=True),
        sa.Column("schedule_mode", sa.String(20), nullable=False, server_default="now"),
        sa.Column("schedule_at", sa.String(50), nullable=True),
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_employment_id"], ["employments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notification_drafts_owner", "notification_drafts", ["owner_employment_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_drafts_owner", table_name="notification_drafts")
    op.drop_table("notification_drafts")
