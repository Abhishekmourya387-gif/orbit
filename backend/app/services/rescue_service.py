from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.rescue_repository import create_rescue_session, get_rescue_history
from app.repositories.user_repository import get_user_by_id
from app.schemas.rescue import RescueSessionCreate


def save_rescue_session(db: Session, user_id: int, payload: RescueSessionCreate):
    if get_user_by_id(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return create_rescue_session(
        db,
        user_id,
        {
            "activity_type": payload.activity_type,
            "duration_seconds": payload.duration_seconds,
            "completed": payload.completed,
        },
    )


def read_rescue_history(db: Session, user_id: int):
    if get_user_by_id(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return get_rescue_history(db, user_id)
