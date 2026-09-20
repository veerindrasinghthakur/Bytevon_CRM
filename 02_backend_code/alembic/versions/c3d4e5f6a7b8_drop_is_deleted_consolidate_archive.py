"""consolidate soft-delete on is_archived; drop is_deleted drift

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-20

Previous settlement work introduced is_deleted/deleted_at/deleted_by on
departments + platforms alongside the established is_archived lifecycle.
Canonical mechanism is is_archived: backfill, then drop the duplicates.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = __import__('sqlalchemy').inspect(bind)
    return any(c['name'] == column for c in insp.get_columns(table))


def upgrade() -> None:
    for table in ('departments', 'platforms'):
        if _table_has_column(table, 'is_deleted'):
            op.execute(
                f"UPDATE {table} SET is_archived = true "
                f"WHERE is_deleted = true AND is_archived IS DISTINCT FROM true"
            )
            op.drop_column(table, 'deleted_by')
            op.drop_column(table, 'deleted_at')
            op.drop_column(table, 'is_deleted')


def downgrade() -> None:
    import sqlalchemy as sa

    for table in ('departments', 'platforms'):
        if not _table_has_column(table, 'is_deleted'):
            op.add_column(table, sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False))
            op.add_column(table, sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
            op.add_column(table, sa.Column('deleted_by', sa.Integer(), nullable=True))
