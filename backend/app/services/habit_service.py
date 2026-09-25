from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.habit import Habit
from app.repositories.habit_repository import create_habit_for_user, get_habits_by_user
from app.repositories.user_repository import get_user_by_id


def get_habits(db: Session, user_id: int) -> list[Habit]:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return get_habits_by_user(db, user_id)


def save_habit(db: Session, user_id: int, habit_data: dict) -> Habit:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    payload = {
        "title": habit_data.get("title"),
        "description": habit_data.get("description"),
        "frequency": habit_data.get("frequency", "daily"),
        "streak": habit_data.get("streak", 0),
        "completed_today": habit_data.get("completed_today", False),
    }
    return create_habit_for_user(db, user_id, payload)
