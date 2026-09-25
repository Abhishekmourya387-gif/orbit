"""add xp gamification fields and activity table

Revision ID: 20260925_add_xp_gamification
Revises: 66120952ff28
Create Date: 2026-09-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260925_add_xp_gamification"
down_revision: Union[str, Sequence[str], None] = "66120952ff28"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("xp_points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("level", sa.Integer(), nullable=False, server_default="1"))
    op.create_table(
        "xp_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=100), nullable=False),
        sa.Column("xp_amount", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_xp_activities_id"), "xp_activities", ["id"], unique=False)
    op.create_index(op.f("ix_xp_activities_user_id"), "xp_activities", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_xp_activities_user_id"), table_name="xp_activities")
    op.drop_index(op.f("ix_xp_activities_id"), table_name="xp_activities")
    op.drop_table("xp_activities")
    op.drop_column("users", "level")
    op.drop_column("users", "xp_points")
