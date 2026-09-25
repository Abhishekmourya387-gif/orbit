"""add private rescue session history

Revision ID: 20260925_add_rescue_sessions
Revises: 20260925_add_feature_tables
Create Date: 2026-09-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260925_add_rescue_sessions"
down_revision: Union[str, Sequence[str], None] = "20260925_add_feature_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rescue_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rescue_sessions_id"), "rescue_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_rescue_sessions_user_id"), "rescue_sessions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_rescue_sessions_user_id"), table_name="rescue_sessions")
    op.drop_index(op.f("ix_rescue_sessions_id"), table_name="rescue_sessions")
    op.drop_table("rescue_sessions")