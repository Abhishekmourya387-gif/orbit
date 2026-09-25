from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class DailyCheckIn(Base):
    __tablename__ = "daily_checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mood: Mapped[str | None] = mapped_column(String(50), nullable=True)
    energy_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    focus_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reflection: Mapped[str | None] = mapped_column(String(500), nullable=True)
    win_of_day: Mapped[str | None] = mapped_column(String(200), nullable=True)
    blockers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user: Mapped["User"] = relationship(back_populates="checkins")
