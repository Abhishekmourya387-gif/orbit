from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile import Profile


def get_profile_by_user_id(db: Session, user_id: int) -> Profile | None:
    statement = select(Profile).where(Profile.user_id == user_id)
    return db.scalar(statement)


def create_profile_for_user(db: Session, user_id: int) -> Profile:
    profile = Profile(
        user_id=user_id,
        bio=None,
        primary_goal=None,
        current_challenges=[],
        preferred_habits=[],
        focus_goals=None,
        improvement_goals=None,
        profile_completion=0,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
