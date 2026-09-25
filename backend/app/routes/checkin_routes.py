from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.checkin_controller import (
    create_checkin,
    read_checkin_history,
    read_recent_checkins,
    read_today_checkin,
)
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.checkin import DailyCheckInCreate, DailyCheckInResponse

router = APIRouter(prefix="/api/v1/checkins", tags=["Check-ins"])


@router.get("", response_model=list[DailyCheckInResponse], status_code=status.HTTP_200_OK)
def list_checkins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_recent_checkins(db, current_user.id)


@router.get("/today", response_model=DailyCheckInResponse | None, status_code=status.HTTP_200_OK)
def get_today_checkin_entry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_today_checkin(db, current_user.id)


@router.get("/history", response_model=list[DailyCheckInResponse], status_code=status.HTTP_200_OK)
def get_checkin_history_entry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_checkin_history(db, current_user.id)


@router.post(
    "",
    response_model=DailyCheckInResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_checkin_entry(
    payload: DailyCheckInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_checkin(db, current_user.id, payload)
