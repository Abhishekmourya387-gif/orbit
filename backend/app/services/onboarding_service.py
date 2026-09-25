from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.onboarding import Onboarding
from app.repositories.onboarding_repository import (
    create_onboarding_for_user,
    get_onboarding_by_user_id,
)
from app.repositories.user_repository import get_user_by_id


def get_onboarding(db: Session, user_id: int) -> Onboarding | None:
    onboarding = get_onboarding_by_user_id(db, user_id)
    if onboarding is None:
        user = get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        onboarding = create_onboarding_for_user(db, user_id)

    return onboarding


def save_onboarding(db: Session, user_id: int, onboarding_data: dict) -> Onboarding:
    onboarding = get_onboarding_by_user_id(db, user_id)
    if onboarding is None:
        user = get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        onboarding = create_onboarding_for_user(db, user_id)

    for field_name in (
        "primary_goal",
        "current_challenges",
        "common_triggers",
        "preferred_routine",
        "focus_goals",
        "improvement_goals",
    ):
        if field_name in onboarding_data:
            value = onboarding_data[field_name]
            if value is not None:
                setattr(onboarding, field_name, value)

    db.commit()
    db.refresh(onboarding)
    return onboarding
