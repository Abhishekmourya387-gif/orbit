from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.habit import Habit


def get_habits_by_user(db: Session, user_id: int):
    statement = select(Habit).where(Habit.user_id == user_id).order_by(Habit.created_at.desc())
    return db.scalars(statement).all()


def create_habit_for_user(db: Session, user_id: int, payload: dict) -> Habit:
    habit = Habit(user_id=user_id, **payload)
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit
