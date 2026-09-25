"""Notification attachments table.

Revision ID: q7r8s9t0u1v2
"""

from __future__ import annotations

from typing import Union

from alembic import op
import sqlalchemy as sa

revision: str = "q7r8s9t0u1v2"
down_revision: Union[str, None] = "p6q7r8s9t0u1"


def upgrade() -> None:
    op.create_table(
        "notification_attachments",
        sa.Column("notification_id", sa.Integer(), nullable=True),
        sa.Column("file_reference", sa.Text(), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(120), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), nullable=True),
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["notification_id"], ["notifications.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notification_attachments_notification_id", "notification_attachments", ["notification_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_attachments_notification_id", table_name="notification_attachments")
    op.drop_table("notification_attachments")
