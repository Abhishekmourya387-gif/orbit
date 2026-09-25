from sqlalchemy.orm import Session

from app.models.user import User
from app.services.insight_service import get_insight_summary


def read_insights(db: Session, current_user: User):
    return get_insight_summary(db, current_user.id)
