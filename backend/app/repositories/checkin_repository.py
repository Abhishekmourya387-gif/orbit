from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.checkin import DailyCheckIn


def get_recent_checkins_by_user(db: Session, user_id: int, limit: int = 7):
    statement = (
        select(DailyCheckIn)
        .where(DailyCheckIn.user_id == user_id)
        .order_by(DailyCheckIn.created_at.desc())
        .limit(limit)
    )
    return db.scalars(statement).all()


def get_history_checkins_by_user(db: Session, user_id: int, limit: int = 30):
    statement = (
        select(DailyCheckIn)
        .where(DailyCheckIn.user_id == user_id)
        .order_by(DailyCheckIn.created_at.desc())
        .limit(limit)
    )
    return db.scalars(statement).all()


def get_today_checkin_by_user(db: Session, user_id: int, today: datetime) -> DailyCheckIn | None:
    start_of_day = datetime.combine(today.date(), datetime.min.time())
    end_of_day = start_of_day.replace(hour=23, minute=59, second=59, microsecond=999999)

    statement = (
        select(DailyCheckIn)
        .where(DailyCheckIn.user_id == user_id)
        .where(DailyCheckIn.created_at >= start_of_day)
        .where(DailyCheckIn.created_at <= end_of_day)
        .order_by(DailyCheckIn.created_at.desc())
    )
    return db.scalar(statement)


def create_checkin_for_user(db: Session, user_id: int, payload: dict) -> DailyCheckIn:
    checkin = DailyCheckIn(user_id=user_id, **payload)
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin
