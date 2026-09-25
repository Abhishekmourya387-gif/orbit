from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.xp import XpAwardRequest
from app.services.xp_service import award_xp, get_xp_summary


def read_xp_summary(db: Session, current_user: User):
    return get_xp_summary(db, current_user.id)


def grant_xp(db: Session, current_user: User, payload: XpAwardRequest):
    return award_xp(
        db,
        current_user.id,
        payload.amount,
        source=payload.source,
        description=payload.description,
    )
