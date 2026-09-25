from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.checkin_service import save_checkin
from app.services.dashboard_service import get_dashboard_summary
from app.services.onboarding_service import save_onboarding


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_dashboard_summary_combines_user_data_and_recent_checkins():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    save_onboarding(
        db,
        user.id,
        {
            "primary_goal": "Improve focus",
            "current_challenges": ["Distraction"],
            "common_triggers": ["Late nights"],
            "preferred_routine": "Morning planning",
            "focus_goals": "Deep work blocks",
            "improvement_goals": "Build consistency",
        },
    )

    save_checkin(
        db,
        user.id,
        {
            "mood": "energized",
            "energy_level": 8,
            "focus_rating": 7,
            "reflection": "Focused on my top goal today.",
            "win_of_day": "Finished priority work",
            "blockers": ["Email overload"],
        },
    )

    summary = get_dashboard_summary(db, user.id)

    assert summary["user"]["id"] == user.id
    assert summary["user"]["full_name"] == "Ava Orbit"
    assert summary["onboarding"]["primary_goal"] == "Improve focus"
    assert summary["checkins"][0]["mood"] == "energized"
    assert summary["checkins"][0]["win_of_day"] == "Finished priority work"
    assert summary["profile"]["primary_goal"] is not None
