from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.streak_controller import read_streak
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.streak import StreakResponse

router = APIRouter(prefix="/api/v1", tags=["Streak"])


@router.get("/streak", response_model=StreakResponse, status_code=status.HTTP_200_OK)
def streak_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_streak(db, current_user.id)
