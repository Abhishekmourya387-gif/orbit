from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.focus import FocusEvent, FocusSession


def create_focus_session_for_user(db: Session, user_id: int, payload: dict) -> FocusSession:
    session = FocusSession(
        user_id=user_id,
        goal=payload["goal"],
        duration_minutes=payload.get("duration_minutes", 25),
        status="active",
        started_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_focus_session_by_id(db: Session, session_id: int) -> FocusSession | None:
    return db.get(FocusSession, session_id)


def get_focus_sessions_by_user(db: Session, user_id: int):
    statement = (
        select(FocusSession)
        .where(FocusSession.user_id == user_id)
        .order_by(FocusSession.started_at.desc())
    )
    return db.scalars(statement).all()


def create_focus_event_for_session(db: Session, session_id: int, payload: dict) -> FocusEvent:
    event = FocusEvent(
        session_id=session_id,
        event_type=payload.get("event_type", "distraction"),
        source=payload.get("source"),
        note=payload.get("note"),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_focus_events_by_session(db: Session, session_id: int):
    statement = (
        select(FocusEvent)
        .where(FocusEvent.session_id == session_id)
        .order_by(FocusEvent.occurred_at.asc())
    )
    return db.scalars(statement).all()
