from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.leaderboard_controller import read_leaderboard
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.leaderboard import LeaderboardResponse

router = APIRouter(prefix="/api/v1/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse, status_code=status.HTTP_200_OK)
def get_leaderboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_leaderboard(db=db, current_user=current_user)
