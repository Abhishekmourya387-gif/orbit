from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.profile_repository import get_profile_by_user_id, create_profile_for_user
from app.repositories.user_repository import get_user_by_id
from app.services.profile_service import get_profile
from app.services.xp_service import award_xp
from app.models.xp_activity import XpActivity

DEFAULT_CHALLENGES = [
    "Consistency Check-In",
    "3-day focus streak",
    "Goal Sprint",
    "Distraction Reset",
]

CHALLENGE_XP = {
    "Consistency Check-In": 50,
    "3-day focus streak": 75,
    "Goal Sprint": 100,
    "Distraction Reset": 60,
}


def _get_completed_challenges(db: Session, user_id: int) -> list[str]:
    statement = (
        select(XpActivity)
        .where(XpActivity.user_id == user_id)
        .where(XpActivity.source == "challenge")
    )
    completed = []
    for activity in db.scalars(statement).all():
        description = activity.description or ""
        if description.startswith("Completed challenge: "):
            completed.append(description.replace("Completed challenge: ", "", 1))
    return sorted(set(completed))


def get_challenge_summary(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise ValueError("User not found")

    profile = get_profile_by_user_id(db, user_id)
    if profile is None:
        profile = create_profile_for_user(db, user_id)

    active_challenges = list(profile.current_challenges or [])
    completed_challenges = _get_completed_challenges(db, user_id)

    return {
        "user_id": user_id,
        "available_challenges": DEFAULT_CHALLENGES,
        "active_challenges": active_challenges,
        "completed_challenges": completed_challenges,
    }


def join_challenge(db: Session, user_id: int, challenge_name: str) -> dict:
    if challenge_name not in DEFAULT_CHALLENGES:
        raise ValueError(f"Unknown challenge: {challenge_name}")

    profile = get_profile(db, user_id)
    active_challenges = list(profile.current_challenges or [])
    if challenge_name in active_challenges:
        return {
            "challenge_name": challenge_name,
            "joined": True,
        }

    active_challenges.append(challenge_name)
    profile.current_challenges = active_challenges
    db.commit()
    db.refresh(profile)

    return {
        "challenge_name": challenge_name,
        "joined": True,
    }


def complete_challenge(db: Session, user_id: int, challenge_name: str) -> dict:
    if challenge_name not in DEFAULT_CHALLENGES:
        raise ValueError(f"Unknown challenge: {challenge_name}")

    profile = get_profile(db, user_id)
    active_challenges = list(profile.current_challenges or [])
    if challenge_name not in active_challenges:
        raise ValueError(f"Challenge not active: {challenge_name}")

    active_challenges.remove(challenge_name)
    profile.current_challenges = active_challenges
    db.commit()

    xp_awarded = CHALLENGE_XP[challenge_name]
    award_xp(
        db,
        user_id,
        xp_awarded,
        source="challenge",
        description=f"Completed challenge: {challenge_name}",
    )

    return {
        "challenge_name": challenge_name,
        "completed": True,
        "xp_awarded": xp_awarded,
    }
