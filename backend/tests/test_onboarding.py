from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.onboarding_service import get_onboarding, save_onboarding


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_onboarding_is_created_and_updated():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    created = get_onboarding(db, user.id)
    assert created is not None
    assert created.primary_goal is None

    updated = save_onboarding(
        db,
        user.id,
        {
            "primary_goal": "Improve focus",
            "current_challenges": ["Distraction", "Stress"],
            "common_triggers": ["Late nights", "Social media"],
            "preferred_routine": "Morning planning and evening reset",
            "focus_goals": "Deep work blocks",
            "improvement_goals": "Build consistency",
        },
    )

    assert updated.primary_goal == "Improve focus"
    assert updated.preferred_routine == "Morning planning and evening reset"
    assert updated.focus_goals == "Deep work blocks"
