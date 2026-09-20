"""add department soft-delete columns

Revision ID: a1b2c3d4e5f6
Revises: f1c2d4b87ad6
Create Date: 2026-09-20
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f1c2d4b87ad6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('departments', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False, comment='Whether this record has been soft-deleted'))
    op.add_column('departments', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft-delete timestamp'))
    op.add_column('departments', sa.Column('deleted_by', sa.Integer(), nullable=True, comment='Employment ID who deleted this record'))
    # Backfill legacy archived rows as deleted for consistent lifecycle
    op.execute("UPDATE departments SET is_deleted = true WHERE is_archived = true")


def downgrade() -> None:
    op.drop_column('departments', 'deleted_by')
    op.drop_column('departments', 'deleted_at')
    op.drop_column('departments', 'is_deleted')
