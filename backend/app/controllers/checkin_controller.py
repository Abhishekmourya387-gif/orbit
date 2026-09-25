from sqlalchemy.orm import Session

from app.schemas.checkin import DailyCheckInCreate, DailyCheckInResponse
from app.services.checkin_service import get_checkin_history, get_recent_checkins, get_today_checkin, save_checkin


def read_recent_checkins(db: Session, user_id: int, limit: int = 7):
    checkins = get_recent_checkins(db, user_id, limit=limit)
    return [DailyCheckInResponse.model_validate(item) for item in checkins]


def read_today_checkin(db: Session, user_id: int):
    checkin = get_today_checkin(db, user_id)
    return DailyCheckInResponse.model_validate(checkin) if checkin else None


def read_checkin_history(db: Session, user_id: int, limit: int = 30):
    checkins = get_checkin_history(db, user_id, limit=limit)
    return [DailyCheckInResponse.model_validate(item) for item in checkins]


def create_checkin(db: Session, user_id: int, data: DailyCheckInCreate) -> DailyCheckInResponse:
    payload = save_checkin(db, user_id, data.model_dump(exclude_unset=True))
    return DailyCheckInResponse.model_validate(payload)
