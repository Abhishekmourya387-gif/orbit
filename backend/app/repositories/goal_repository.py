from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.goal import Goal


def get_goals_by_user(db: Session, user_id: int):
    statement = select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.desc())
    return db.scalars(statement).all()


def create_goal_for_user(db: Session, user_id: int, payload: dict) -> Goal:
    goal = Goal(user_id=user_id, **payload)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal
