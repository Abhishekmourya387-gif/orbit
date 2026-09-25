from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.checkin_service import (
    get_checkin_history,
    get_today_checkin,
    get_recent_checkins,
    save_checkin,
)


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_daily_checkin_is_created_and_retrieved():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava@example.com",
            password="StrongPass123!",
        ),
    )

    initial = get_recent_checkins(db, user.id)
    assert initial == []

    saved = save_checkin(
        db,
        user.id,
        {
            "mood": "energized",
            "energy_level": 8,
            "focus_rating": 7,
            "reflection": "Kept momentum on my main goal.",
            "win_of_day": "Finished deep work blocks",
            "blockers": ["Email overload"],
        },
    )

    assert saved.mood == "energized"
    assert saved.energy_level == 8
    assert saved.focus_rating == 7

    recent = get_recent_checkins(db, user.id)
    assert len(recent) == 1
    assert recent[0].win_of_day == "Finished deep work blocks"

    today_checkin = get_today_checkin(db, user.id)
    assert today_checkin is not None
    assert today_checkin.id == saved.id

    history = get_checkin_history(db, user.id)
    assert len(history) == 1
    assert history[0].id == saved.id


def test_daily_checkin_prevents_duplicates_for_same_day():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ava Orbit",
            email="ava2@example.com",
            password="StrongPass123!",
        ),
    )

    save_checkin(
        db,
        user.id,
        {
            "mood": "calm",
            "energy_level": 6,
            "focus_rating": 6,
            "reflection": "First check-in",
            "win_of_day": "Started healthy routine",
            "blockers": [],
        },
    )

    try:
        save_checkin(
            db,
            user.id,
            {
                "mood": "tired",
                "energy_level": 3,
                "focus_rating": 2,
                "reflection": "Second check-in",
                "win_of_day": "Tried again",
                "blockers": [],
            },
        )
        assert False, "Expected duplicate check-in error"
    except HTTPException as exc:
        assert exc.status_code == 409
        assert "already" in str(exc.detail).lower()
