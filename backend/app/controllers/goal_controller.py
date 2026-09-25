from sqlalchemy.orm import Session

from app.schemas.goal import GoalCreate, GoalResponse
from app.services.goal_service import get_goals, save_goal


def read_goals(db: Session, user_id: int):
    goals = get_goals(db, user_id)
    return [GoalResponse.model_validate(item) for item in goals]


def create_goal(db: Session, user_id: int, data: GoalCreate) -> GoalResponse:
    goal = save_goal(db, user_id, data.model_dump(exclude_unset=True))
    return GoalResponse.model_validate(goal)
