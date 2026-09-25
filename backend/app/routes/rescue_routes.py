from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.rescue_controller import create_rescue_session_entry, list_rescue_history
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rescue import RescueSessionCreate, RescueSessionResponse

router = APIRouter(prefix="/api/v1/rescue", tags=["Rescue"])


@router.post("/sessions", response_model=RescueSessionResponse, status_code=status.HTTP_201_CREATED)
def create_rescue_session_endpoint(
    payload: RescueSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_rescue_session_entry(db, current_user, payload)


@router.get("/history", response_model=list[RescueSessionResponse], status_code=status.HTTP_200_OK)
def get_rescue_history_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_rescue_history(db, current_user)
