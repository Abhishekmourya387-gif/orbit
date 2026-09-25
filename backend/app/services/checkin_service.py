from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.checkin import DailyCheckIn
from app.repositories.checkin_repository import (
    create_checkin_for_user,
    get_history_checkins_by_user,
    get_recent_checkins_by_user,
    get_today_checkin_by_user,
)
from app.repositories.user_repository import get_user_by_id


def get_recent_checkins(db: Session, user_id: int, limit: int = 7) -> list[DailyCheckIn]:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return get_recent_checkins_by_user(db, user_id, limit=limit)


def get_today_checkin(db: Session, user_id: int) -> DailyCheckIn | None:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    today = datetime.now(timezone.utc)
    return get_today_checkin_by_user(db, user_id, today)


def get_checkin_history(db: Session, user_id: int, limit: int = 30) -> list[DailyCheckIn]:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return get_history_checkins_by_user(db, user_id, limit=limit)


def save_checkin(db: Session, user_id: int, checkin_data: dict) -> DailyCheckIn:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    today_checkin = get_today_checkin(db, user_id)
    if today_checkin is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Daily check-in already exists for today.",
        )

    payload = {
        "mood": checkin_data.get("mood"),
        "energy_level": checkin_data.get("energy_level"),
        "focus_rating": checkin_data.get("focus_rating"),
        "reflection": checkin_data.get("reflection"),
        "win_of_day": checkin_data.get("win_of_day"),
        "blockers": checkin_data.get("blockers") or [],
    }
    return create_checkin_for_user(db, user_id, payload)
