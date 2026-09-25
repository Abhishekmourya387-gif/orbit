from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.checkin_service import save_checkin
from app.services.focus_service import start_focus_session
from app.services.insight_service import get_insight_summary


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_insight_summary_builds_actionable_recommendations():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Nova Orbit",
            email="nova-insights@example.com",
            password="StrongPass123!",
        ),
    )

    save_checkin(
        db,
        user.id,
        {
            "mood": "motivated",
            "energy_level": 8,
            "focus_rating": 7,
            "reflection": "Strong session today.",
            "win_of_day": "Stayed consistent",
            "blockers": ["email"],
        },
    )

    start_focus_session(
        db,
        user.id,
        {"goal": "Deep work session", "duration_minutes": 45},
    )

    summary = get_insight_summary(db, user.id)

    assert summary["user_id"] == user.id
    assert summary["headline"]
    assert isinstance(summary["recommendations"], list)
    assert len(summary["recommendations"]) >= 2
    assert summary["focus_score"] >= 0
    assert summary["energy_trend"] in {"up", "steady", "down"}
