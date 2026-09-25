from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.goal_service import get_goals, save_goal


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_goals_can_be_created_and_listed():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    saved = save_goal(
        db,
        user.id,
        {
            "title": "Ship the MVP",
            "description": "Finish my launch checklist",
            "status": "active",
            "target_date": "2026-10-15",
            "progress": 35,
        },
    )

    assert saved.title == "Ship the MVP"
    assert saved.status == "active"

    goals = get_goals(db, user.id)
    assert len(goals) == 1
    assert goals[0].target_date == "2026-10-15"
