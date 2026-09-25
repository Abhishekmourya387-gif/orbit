from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rescue import RescueSession


def create_rescue_session(db: Session, user_id: int, payload: dict) -> RescueSession:
    rescue_session = RescueSession(user_id=user_id, **payload)
    db.add(rescue_session)
    db.commit()
    db.refresh(rescue_session)
    return rescue_session


def get_rescue_history(db: Session, user_id: int, limit: int = 30) -> list[RescueSession]:
    statement = (
        select(RescueSession)
        .where(RescueSession.user_id == user_id)
        .order_by(RescueSession.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(statement).all())
