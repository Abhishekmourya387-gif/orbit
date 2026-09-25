from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.focus import FocusEvent, FocusSession
from app.repositories.focus_repository import (
    create_focus_event_for_session,
    create_focus_session_for_user,
    get_focus_events_by_session,
    get_focus_session_by_id,
    get_focus_sessions_by_user,
)
from app.repositories.user_repository import get_user_by_id


def start_focus_session(db: Session, user_id: int, payload: dict) -> FocusSession:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    goal = (payload.get("goal") or "").strip()
    if len(goal) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Goal must be at least 3 characters long")

    duration_minutes = int(payload.get("duration_minutes", 25))
    if duration_minutes < 5 or duration_minutes > 180:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duration must be between 5 and 180 minutes")

    return create_focus_session_for_user(db, user_id, {"goal": goal, "duration_minutes": duration_minutes})


def record_distraction(db: Session, session_id: int, payload: dict) -> FocusEvent:
    session = get_focus_session_by_id(db, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")

    if session.status not in {"active", "paused"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Distraction can only be logged for active sessions")

    source = (payload.get("source") or "unknown").strip() or "unknown"
    note = (payload.get("note") or "").strip()

    event = create_focus_event_for_session(db, session_id, {"event_type": "distraction", "source": source, "note": note})
    session.distractions_count += 1
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return event


def complete_focus_session(db: Session, session_id: int, payload: dict) -> FocusSession:
    session = get_focus_session_by_id(db, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")

    if session.status == "completed":
        return session

    started_at = session.started_at
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    elapsed_minutes = max(1, int((now - started_at).total_seconds() // 60))
    effective_duration = max(session.duration_minutes, elapsed_minutes)
    session.duration_minutes = effective_duration
    session.notes = payload.get("notes")
    session.status = "completed"
    session.completed_at = now
    session.xp_awarded = max(25, effective_duration * 4)
    session.updated_at = now
    db.commit()
    db.refresh(session)
    return session


def get_focus_history(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return get_focus_sessions_by_user(db, user_id)


def get_focus_analytics(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    sessions = get_focus_sessions_by_user(db, user_id)
    total_sessions = len(sessions)
    completed_sessions = sum(1 for session in sessions if session.status == "completed")
    total_minutes = sum(session.duration_minutes for session in sessions)
    total_distractions = sum(session.distractions_count for session in sessions)
    average_session_minutes = round(total_minutes / total_sessions, 2) if total_sessions else 0.0
    best_session_minutes = max((session.duration_minutes for session in sessions), default=0)

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_minutes": total_minutes,
        "total_distractions": total_distractions,
        "average_session_minutes": average_session_minutes,
        "best_session_minutes": best_session_minutes,
    }
