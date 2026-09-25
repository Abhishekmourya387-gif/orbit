from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.focus_controller import (
    add_distraction,
    finalize_session,
    read_focus_analytics,
    read_focus_history,
    start_session,
)
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.focus import (
    FocusAnalyticsResponse,
    FocusDistractionCreate,
    FocusEventResponse,
    FocusSessionComplete,
    FocusSessionCreate,
    FocusSessionResponse,
)

router = APIRouter(prefix="/api/v1/focus", tags=["Focus"])


@router.post("/start", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def start_focus_endpoint(
    payload: FocusSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return start_session(db, current_user.id, payload)


@router.post("/{session_id}/complete", response_model=FocusSessionResponse, status_code=status.HTTP_200_OK)
def complete_focus_endpoint(
    session_id: int,
    payload: FocusSessionComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return finalize_session(db, session_id, current_user.id, payload)


@router.post("/{session_id}/distraction", response_model=FocusEventResponse, status_code=status.HTTP_201_CREATED)
def distraction_focus_endpoint(
    session_id: int,
    payload: FocusDistractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_distraction(db, session_id, current_user.id, payload)


@router.get("/history", response_model=list[FocusSessionResponse], status_code=status.HTTP_200_OK)
def history_focus_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_focus_history(db, current_user.id)


@router.get("/analytics", response_model=FocusAnalyticsResponse, status_code=status.HTTP_200_OK)
def analytics_focus_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_focus_analytics(db, current_user.id)
