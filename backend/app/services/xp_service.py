from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.xp_activity import XpActivity
from app.repositories.user_repository import get_user_by_id
from app.repositories.xp_repository import create_xp_activity, get_recent_xp_activities_by_user

LEVEL_XP_STEP = 100


def calculate_level(xp_points: int) -> int:
    return max(1, 1 + (xp_points // LEVEL_XP_STEP))


def calculate_badges(xp_points: int) -> list[str]:
    badges: list[str] = []
    if xp_points >= 100:
        badges.append("Spark Starter")
    if xp_points >= 250:
        badges.append("Momentum Builder")
    if xp_points >= 500:
        badges.append("Orbit Veteran")
    if xp_points >= 1000:
        badges.append("Orbital Legend")
    return badges


def award_xp(
    db: Session,
    user_id: int,
    amount: int,
    *,
    source: str = "manual",
    description: str | None = None,
) -> XpActivity:
    if amount < 0:
        raise ValueError("XP amount must be non-negative")

    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.xp_points += amount
    user.level = calculate_level(user.xp_points)

    activity = create_xp_activity(
        db,
        user_id=user_id,
        source=source,
        xp_amount=amount,
        description=description,
    )
    db.commit()
    db.refresh(user)
    return activity


def get_xp_summary(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    level = calculate_level(user.xp_points)
    current_level_floor = (level - 1) * LEVEL_XP_STEP
    next_level_threshold = level * LEVEL_XP_STEP
    xp_to_next_level = max(0, next_level_threshold - user.xp_points)
    progress_percentage = 100.0 * max(0.0, (user.xp_points - current_level_floor) / LEVEL_XP_STEP)

    recent_activities = [
        {
            "id": activity.id,
            "user_id": activity.user_id,
            "source": activity.source,
            "xp_amount": activity.xp_amount,
            "description": activity.description,
            "created_at": activity.created_at,
        }
        for activity in get_recent_xp_activities_by_user(db, user_id, limit=5)
    ]

    return {
        "user_id": user_id,
        "total_xp": user.xp_points,
        "level": level,
        "xp_to_next_level": xp_to_next_level,
        "progress_percentage": round(progress_percentage, 2),
        "badges": calculate_badges(user.xp_points),
        "recent_activities": recent_activities,
    }
