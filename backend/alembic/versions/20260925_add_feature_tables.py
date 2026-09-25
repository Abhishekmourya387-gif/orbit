"""add core app feature tables

Revision ID: 20260925_add_feature_tables
Revises: 20260925_add_notifications
Create Date: 2026-09-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260925_add_feature_tables"
down_revision: Union[str, Sequence[str], None] = "20260925_add_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("bio", sa.String(length=500), nullable=True),
        sa.Column("primary_goal", sa.String(length=200), nullable=True),
        sa.Column("current_challenges", sa.JSON(), nullable=True),
        sa.Column("preferred_habits", sa.JSON(), nullable=True),
        sa.Column("focus_goals", sa.String(length=200), nullable=True),
        sa.Column("improvement_goals", sa.String(length=200), nullable=True),
        sa.Column("profile_completion", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_profiles_user_id"),
    )
    op.create_index(op.f("ix_profiles_id"), "profiles", ["id"], unique=False)
    op.create_index(op.f("ix_profiles_user_id"), "profiles", ["user_id"], unique=False)

    op.create_table(
        "onboarding",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("primary_goal", sa.String(length=200), nullable=True),
        sa.Column("current_challenges", sa.JSON(), nullable=True),
        sa.Column("common_triggers", sa.JSON(), nullable=True),
        sa.Column("preferred_routine", sa.String(length=250), nullable=True),
        sa.Column("focus_goals", sa.String(length=200), nullable=True),
        sa.Column("improvement_goals", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_onboarding_user_id"),
    )
    op.create_index(op.f("ix_onboarding_id"), "onboarding", ["id"], unique=False)
    op.create_index(op.f("ix_onboarding_user_id"), "onboarding", ["user_id"], unique=False)

    op.create_table(
        "daily_checkins",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("mood", sa.String(length=50), nullable=True),
        sa.Column("energy_level", sa.Integer(), nullable=True),
        sa.Column("focus_rating", sa.Integer(), nullable=True),
        sa.Column("reflection", sa.String(length=500), nullable=True),
        sa.Column("win_of_day", sa.String(length=200), nullable=True),
        sa.Column("blockers", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_daily_checkins_id"), "daily_checkins", ["id"], unique=False)
    op.create_index(op.f("ix_daily_checkins_user_id"), "daily_checkins", ["user_id"], unique=False)

    op.create_table(
        "habits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("frequency", sa.String(length=50), nullable=False, server_default="daily"),
        sa.Column("streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_today", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_habits_id"), "habits", ["id"], unique=False)
    op.create_index(op.f("ix_habits_user_id"), "habits", ["user_id"], unique=False)

    op.create_table(
        "goals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("target_date", sa.String(length=50), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_goals_id"), "goals", ["id"], unique=False)
    op.create_index(op.f("ix_goals_user_id"), "goals", ["user_id"], unique=False)

    op.create_table(
        "focus_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("goal", sa.String(length=255), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="25"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("xp_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("distractions_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_focus_sessions_id"), "focus_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_focus_sessions_user_id"), "focus_sessions", ["user_id"], unique=False)

    op.create_table(
        "focus_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False, server_default="distraction"),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["focus_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_focus_events_id"), "focus_events", ["id"], unique=False)
    op.create_index(op.f("ix_focus_events_session_id"), "focus_events", ["session_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_focus_events_session_id"), table_name="focus_events")
    op.drop_index(op.f("ix_focus_events_id"), table_name="focus_events")
    op.drop_table("focus_events")

    op.drop_index(op.f("ix_focus_sessions_user_id"), table_name="focus_sessions")
    op.drop_index(op.f("ix_focus_sessions_id"), table_name="focus_sessions")
    op.drop_table("focus_sessions")

    op.drop_index(op.f("ix_goals_user_id"), table_name="goals")
    op.drop_index(op.f("ix_goals_id"), table_name="goals")
    op.drop_table("goals")

    op.drop_index(op.f("ix_habits_user_id"), table_name="habits")
    op.drop_index(op.f("ix_habits_id"), table_name="habits")
    op.drop_table("habits")

    op.drop_index(op.f("ix_daily_checkins_user_id"), table_name="daily_checkins")
    op.drop_index(op.f("ix_daily_checkins_id"), table_name="daily_checkins")
    op.drop_table("daily_checkins")

    op.drop_index(op.f("ix_onboarding_user_id"), table_name="onboarding")
    op.drop_index(op.f("ix_onboarding_id"), table_name="onboarding")
    op.drop_table("onboarding")

    op.drop_index(op.f("ix_profiles_user_id"), table_name="profiles")
    op.drop_index(op.f("ix_profiles_id"), table_name="profiles")
    op.drop_table("profiles")
