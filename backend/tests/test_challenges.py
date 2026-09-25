from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.challenge_service import complete_challenge, get_challenge_summary, join_challenge


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_get_challenge_summary_lists_available_active_and_completed_items():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Luna Orbit",
            email="luna@example.com",
            password="StrongPass123!",
        ),
    )

    summary = get_challenge_summary(db, user.id)

    assert summary["user_id"] == user.id
    assert len(summary["available_challenges"]) >= 3
    assert isinstance(summary["active_challenges"], list)
    assert isinstance(summary["completed_challenges"], list)


def test_complete_challenge_awards_xp_and_tracks_completion():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Milo Orbit",
            email="milo@example.com",
            password="StrongPass123!",
        ),
    )

    join_challenge(db, user.id, "Consistency Check-In")
    result = complete_challenge(db, user.id, "Consistency Check-In")

    assert result["challenge_name"] == "Consistency Check-In"
    assert result["xp_awarded"] > 0
    assert result["completed"] is True

    summary = get_challenge_summary(db, user.id)
    assert "Consistency Check-In" in summary["completed_challenges"]
    assert "Consistency Check-In" not in summary["active_challenges"]
