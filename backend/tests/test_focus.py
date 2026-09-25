from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.focus_service import complete_focus_session, get_focus_analytics, get_focus_history, record_distraction, start_focus_session


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_focus_session_lifecycle_and_analytics():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    session = start_focus_session(db, user.id, {
        "goal": "Ship the onboarding flow",
        "duration_minutes": 25,
    })

    assert session.status == "active"
    assert session.goal == "Ship the onboarding flow"

    distraction = record_distraction(db, session.id, {
        "source": "phone",
        "note": "Checked messages",
    })
    assert distraction.source == "phone"

    completed = complete_focus_session(db, session.id, {
        "completed": True,
        "notes": "Finished the outline",
    })

    assert completed.status == "completed"
    assert completed.duration_minutes > 0
    assert completed.xp_awarded > 0

    history = get_focus_history(db, user.id)
    assert len(history) == 1
    assert history[0].id == session.id

    analytics = get_focus_analytics(db, user.id)
    assert analytics["total_sessions"] == 1
    assert analytics["completed_sessions"] == 1
    assert analytics["total_distractions"] >= 1
