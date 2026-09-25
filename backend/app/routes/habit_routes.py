from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.habit_controller import create_habit, read_habits
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitResponse

router = APIRouter(prefix="/api/v1/habits", tags=["Habits"])


@router.get("", response_model=list[HabitResponse], status_code=status.HTTP_200_OK)
def list_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_habits(db, current_user.id)


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit_entry(
    payload: HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_habit(db, current_user.id, payload)
