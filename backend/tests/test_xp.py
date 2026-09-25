from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.xp_service import award_xp, get_xp_summary


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_xp_summary_tracks_points_level_and_badges():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Nova Orbit",
            email="nova@example.com",
            password="StrongPass123!",
        ),
    )

    award_xp(db, user.id, 125, source="focus")
    award_xp(db, user.id, 80, source="checkin")

    summary = get_xp_summary(db, user.id)

    assert summary["user_id"] == user.id
    assert summary["total_xp"] == 205
    assert summary["level"] >= 2
    assert summary["xp_to_next_level"] >= 0
    assert "focus" in summary["recent_activities"][0]["source"] or summary["recent_activities"]
    assert isinstance(summary["badges"], list)
    assert len(summary["badges"]) >= 1


def test_award_xp_rejects_negative_values():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Rhea Orbit",
            email="rhea@example.com",
            password="StrongPass123!",
        ),
    )

    try:
        award_xp(db, user.id, -25, source="cheat")
        assert False, "Expected ValueError for negative XP"
    except ValueError:
        pass
