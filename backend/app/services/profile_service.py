from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.repositories.profile_repository import (
    create_profile_for_user,
    get_profile_by_user_id,
)
from app.repositories.user_repository import get_user_by_id


PROFILE_FIELDS = (
    "bio",
    "primary_goal",
    "current_challenges",
    "preferred_habits",
    "focus_goals",
    "improvement_goals",
)


def _calculate_profile_completion(profile: Profile) -> int:
    completed = 0
    for field_name in PROFILE_FIELDS:
        value = getattr(profile, field_name)
        if field_name in {"current_challenges", "preferred_habits"}:
            if value:
                completed += 1
        elif value not in (None, ""):
            completed += 1

    return round((completed / len(PROFILE_FIELDS)) * 100)


def get_profile(db: Session, user_id: int) -> Profile | None:
    profile = get_profile_by_user_id(db, user_id)
    if profile is None:
        user = get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        profile = create_profile_for_user(db, user_id)

    profile.profile_completion = _calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, user_id: int, profile_data: dict) -> Profile:
    profile = get_profile_by_user_id(db, user_id)
    if profile is None:
        user = get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        profile = create_profile_for_user(db, user_id)

    for field_name in PROFILE_FIELDS:
        if field_name in profile_data:
            value = profile_data[field_name]
            if value is not None:
                setattr(profile, field_name, value)

    profile.profile_completion = _calculate_profile_completion(profile)
    db.commit()
    db.refresh(profile)
    return profile
