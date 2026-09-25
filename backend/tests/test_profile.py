from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.profile_service import get_profile, update_profile


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_profile_is_created_and_updated():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    profile = get_profile(db, user.id)
    assert profile is not None
    assert profile.user_id == user.id
    assert profile.profile_completion >= 0

    updated = update_profile(
        db,
        user.id,
        {
            "bio": "Quiet systems thinker",
            "primary_goal": "Build focus and consistency",
            "current_challenges": ["Stress", "Distraction"],
            "preferred_habits": ["Deep work", "Breathing"],
        },
    )

    assert updated.bio == "Quiet systems thinker"
    assert updated.primary_goal == "Build focus and consistency"
    assert updated.profile_completion > 0
