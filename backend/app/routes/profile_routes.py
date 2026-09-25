from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.profile_controller import edit_profile, read_profile
from app.core.security import get_current_user
from app.models.user import User
from app.db.session import get_db
from app.schemas.profile import ProfileResponse, ProfileUpdate


router = APIRouter(prefix="/api/v1", tags=["Profile"])


@router.get("/profile", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
def get_profile_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_profile(db=db, current_user=current_user)


@router.put("/profile", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
def update_profile_endpoint(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return edit_profile(db=db, current_user=current_user, profile_data=profile_data)
