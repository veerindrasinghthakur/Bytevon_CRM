"""add platform soft-delete columns

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-20
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('platforms', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False, comment='Whether this record has been soft-deleted'))
    op.add_column('platforms', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft-delete timestamp'))
    op.add_column('platforms', sa.Column('deleted_by', sa.Integer(), nullable=True, comment='Employment ID who deleted this record'))
    op.execute("UPDATE platforms SET is_deleted = true WHERE is_archived = true")


def downgrade() -> None:
    op.drop_column('platforms', 'deleted_by')
    op.drop_column('platforms', 'deleted_at')
    op.drop_column('platforms', 'is_deleted')
