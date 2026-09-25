from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.rescue import RescueSessionCreate
from app.services.rescue_service import read_rescue_history, save_rescue_session


def create_rescue_session_entry(db: Session, current_user: User, payload: RescueSessionCreate):
    return save_rescue_session(db, current_user.id, payload)


def list_rescue_history(db: Session, current_user: User):
    return read_rescue_history(db, current_user.id)
