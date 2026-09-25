from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.focus_repository import get_focus_session_by_id
from app.schemas.focus import (
    FocusAnalyticsResponse,
    FocusDistractionCreate,
    FocusEventResponse,
    FocusSessionComplete,
    FocusSessionCreate,
    FocusSessionResponse,
)
from app.services.focus_service import complete_focus_session, get_focus_analytics, get_focus_history, record_distraction, start_focus_session


def start_session(db: Session, user_id: int, payload: FocusSessionCreate):
    session = start_focus_session(db, user_id, payload.model_dump(exclude_unset=True))
    return FocusSessionResponse.model_validate(session)


def add_distraction(db: Session, session_id: int, user_id: int, payload: FocusDistractionCreate):
    session = get_focus_session_by_id(db, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this focus session")
    event = record_distraction(db, session_id, payload.model_dump(exclude_unset=True))
    return FocusEventResponse.model_validate(event)


def finalize_session(db: Session, session_id: int, user_id: int, payload: FocusSessionComplete):
    session = get_focus_session_by_id(db, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this focus session")
    session = complete_focus_session(db, session_id, payload.model_dump(exclude_unset=True))
    return FocusSessionResponse.model_validate(session)


def read_focus_history(db: Session, user_id: int):
    sessions = get_focus_history(db, user_id)
    return [FocusSessionResponse.model_validate(item) for item in sessions]


def read_focus_analytics(db: Session, user_id: int):
    analytics = get_focus_analytics(db, user_id)
    return FocusAnalyticsResponse(**analytics)
