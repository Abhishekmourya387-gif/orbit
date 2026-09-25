from sqlalchemy.orm import Session

from app.models.user import User
from app.services.dashboard_service import get_dashboard_summary


def read_dashboard(db: Session, current_user: User):
    return get_dashboard_summary(db, current_user.id)
