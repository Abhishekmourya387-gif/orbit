from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.onboarding import Onboarding


def get_onboarding_by_user_id(db: Session, user_id: int) -> Onboarding | None:
    statement = select(Onboarding).where(Onboarding.user_id == user_id)
    return db.scalar(statement)


def create_onboarding_for_user(db: Session, user_id: int) -> Onboarding:
    onboarding = Onboarding(
        user_id=user_id,
        primary_goal=None,
        current_challenges=[],
        common_triggers=[],
        preferred_routine=None,
        focus_goals=None,
        improvement_goals=None,
    )
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)
    return onboarding
