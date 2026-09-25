from sqlalchemy.orm import Session

from app.models.user import User
from app.services.leaderboard_service import get_leaderboard_summary


def read_leaderboard(db: Session, current_user: User):
    return get_leaderboard_summary(db, current_user.id)
