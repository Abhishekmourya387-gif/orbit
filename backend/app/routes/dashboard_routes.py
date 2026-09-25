from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.dashboard_controller import read_dashboard
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_dashboard(db=db, current_user=current_user)
