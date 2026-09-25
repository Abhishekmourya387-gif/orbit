from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.repositories.goal_repository import create_goal_for_user, get_goals_by_user
from app.repositories.user_repository import get_user_by_id


def get_goals(db: Session, user_id: int) -> list[Goal]:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return get_goals_by_user(db, user_id)


def save_goal(db: Session, user_id: int, goal_data: dict) -> Goal:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    payload = {
        "title": goal_data.get("title"),
        "description": goal_data.get("description"),
        "status": goal_data.get("status", "active"),
        "target_date": goal_data.get("target_date"),
        "progress": goal_data.get("progress", 0),
    }
    return create_goal_for_user(db, user_id, payload)
