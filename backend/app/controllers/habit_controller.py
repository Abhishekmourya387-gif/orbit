from sqlalchemy.orm import Session

from app.schemas.habit import HabitCreate, HabitResponse
from app.services.habit_service import get_habits, save_habit


def read_habits(db: Session, user_id: int):
    habits = get_habits(db, user_id)
    return [HabitResponse.model_validate(item) for item in habits]


def create_habit(db: Session, user_id: int, data: HabitCreate) -> HabitResponse:
    habit = save_habit(db, user_id, data.model_dump(exclude_unset=True))
    return HabitResponse.model_validate(habit)
