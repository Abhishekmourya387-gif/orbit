from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.models.checkin import DailyCheckIn
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.streak_service import get_streak_summary


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_streak_summary_calculates_current_and_longest_streaks():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    for offset in [0, 1, 2, 5, 6]:
        checkin_date = datetime.now(timezone.utc) - timedelta(days=offset)
        checkin = DailyCheckIn(
            user_id=user.id,
            mood="steady",
            energy_level=7,
            focus_rating=7,
            reflection=f"Check-in for day offset {offset}",
            win_of_day="Kept momentum",
            blockers=[],
            created_at=checkin_date,
        )
        db.add(checkin)
    db.commit()

    summary = get_streak_summary(db, user.id)

    assert summary["current_streak"] >= 1
    assert summary["longest_streak"] >= 3
    assert summary["last_activity"] is not None
    assert summary["streak_status"] in {"active", "at_risk", "inactive"}
    assert summary["user_id"] == user.id
