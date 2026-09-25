from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import get_user_by_id
from app.services.checkin_service import get_recent_checkins
from app.services.onboarding_service import get_onboarding
from app.services.profile_service import get_profile


def get_dashboard_summary(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    profile = get_profile(db, user_id)
    onboarding = get_onboarding(db, user_id)
    checkins = get_recent_checkins(db, user_id, limit=5)

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
        "profile": {
            "bio": profile.bio or "",
            "primary_goal": profile.primary_goal or onboarding.primary_goal,
            "current_challenges": profile.current_challenges or onboarding.current_challenges or [],
            "preferred_habits": profile.preferred_habits or [],
            "focus_goals": profile.focus_goals or onboarding.focus_goals,
            "improvement_goals": profile.improvement_goals or onboarding.improvement_goals,
            "profile_completion": profile.profile_completion,
        },
        "onboarding": {
            "primary_goal": onboarding.primary_goal,
            "current_challenges": onboarding.current_challenges or [],
            "common_triggers": onboarding.common_triggers or [],
            "preferred_routine": onboarding.preferred_routine,
            "focus_goals": onboarding.focus_goals,
            "improvement_goals": onboarding.improvement_goals,
        },
        "checkins": [
            {
                "id": checkin.id,
                "mood": checkin.mood,
                "energy_level": checkin.energy_level,
                "focus_rating": checkin.focus_rating,
                "reflection": checkin.reflection,
                "win_of_day": checkin.win_of_day,
                "blockers": checkin.blockers or [],
                "created_at": checkin.created_at,
            }
            for checkin in checkins
        ],
        "summary": {
            "recent_checkins_count": len(checkins),
            "profile_completion": profile.profile_completion,
        },
    }
