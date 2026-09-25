from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.profile import ProfileUpdate
from app.services.profile_service import get_profile, update_profile


def read_profile(db: Session, current_user: User):
    return get_profile(db, current_user.id)


def edit_profile(db: Session, current_user: User, profile_data: ProfileUpdate):
    return update_profile(
        db,
        current_user.id,
        profile_data.model_dump(exclude_unset=True),
    )
