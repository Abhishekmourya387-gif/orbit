from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    xp_points: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )

    level: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    onboarding: Mapped["Onboarding"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    checkins: Mapped[list["DailyCheckIn"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    focus_sessions: Mapped[list["FocusSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    xp_activities: Mapped[list["XpActivity"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    rescue_sessions: Mapped[list["RescueSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")