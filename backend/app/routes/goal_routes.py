from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.goal_controller import create_goal, read_goals
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse

router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])


@router.get("", response_model=list[GoalResponse], status_code=status.HTTP_200_OK)
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_goals(db, current_user.id)


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal_entry(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_goal(db, current_user.id, payload)
