from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.habit_service import get_habits, save_habit


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_habits_can_be_created_and_listed():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    saved = save_habit(
        db,
        user.id,
        {
            "title": "Morning focus block",
            "description": "Deep work before email",
            "frequency": "daily",
            "streak": 3,
            "completed_today": True,
        },
    )

    assert saved.title == "Morning focus block"

    habits = get_habits(db, user.id)
    assert len(habits) == 1
    assert habits[0].frequency == "daily"
