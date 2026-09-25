from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import get_user_by_id
from app.services.streak_service import get_streak_summary


def get_leaderboard_summary(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise ValueError("User not found")

    statement = select(User).order_by(User.xp_points.desc(), User.created_at.asc())
    users = list(db.scalars(statement).all())

    leaderboard = []
    for index, ranked_user in enumerate(users, start=1):
        streak = get_streak_summary(db, ranked_user.id)
        leaderboard.append(
            {
                "rank": index,
                "user_id": ranked_user.id,
                "full_name": ranked_user.full_name,
                "xp_points": ranked_user.xp_points,
                "level": ranked_user.level,
                "current_streak": streak["current_streak"],
            }
        )

    current_rank = next((entry["rank"] for entry in leaderboard if entry["user_id"] == user_id), 0)
    user_leaderboard = leaderboard[:3]

    return {
        "user_id": user_id,
        "rank": current_rank,
        "top_3_count": len(user_leaderboard),
        "leaders": user_leaderboard,
        "total_users": len(leaderboard),
    }
