from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Onboarding(Base):
    __tablename__ = "onboarding"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_onboarding_user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    primary_goal: Mapped[str | None] = mapped_column(String(200), nullable=True)
    current_challenges: Mapped[list[str] | None] = mapped_column(JSON, nullable=True, default=list)
    common_triggers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True, default=list)
    preferred_routine: Mapped[str | None] = mapped_column(String(250), nullable=True)
    focus_goals: Mapped[str | None] = mapped_column(String(200), nullable=True)
    improvement_goals: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="onboarding")
