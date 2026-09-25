from sqlalchemy.orm import Session

from app.schemas.streak import StreakResponse
from app.services.streak_service import get_streak_summary


def read_streak(db: Session, user_id: int) -> StreakResponse:
    summary = get_streak_summary(db, user_id)
    return StreakResponse.model_validate(summary)
