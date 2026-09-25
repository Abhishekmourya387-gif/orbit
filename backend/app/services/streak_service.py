from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.checkin import DailyCheckIn
from app.repositories.checkin_repository import get_recent_checkins_by_user
from app.repositories.user_repository import get_user_by_id


def _calculate_longest_streak(checkin_dates: list[datetime.date]) -> int:
    if not checkin_dates:
        return 0

    streak = 1
    longest = 1
    for index in range(1, len(checkin_dates)):
        previous_date = checkin_dates[index - 1]
        current_date = checkin_dates[index]
        if (current_date - previous_date).days == 1:
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 1

    return longest


def get_streak_summary(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    checkins = get_recent_checkins_by_user(db, user_id, limit=365)
    if not checkins:
        return {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity": None,
            "streak_status": "inactive",
        }

    unique_dates = sorted({checkin.created_at.date() for checkin in checkins})
    today = datetime.now(timezone.utc).date()
    latest_date = unique_dates[-1]
    current_streak = 0

    if latest_date in {today, today - timedelta(days=1)}:
        current_streak = 1
        cursor = latest_date
        while cursor - timedelta(days=1) in set(unique_dates):
            current_streak += 1
            cursor -= timedelta(days=1)

    longest_streak = _calculate_longest_streak(unique_dates)
    last_activity = max(checkins, key=lambda item: item.created_at).created_at

    if current_streak > 0 and (today - latest_date).days <= 1:
        streak_status = "active"
    elif current_streak > 0 and (today - latest_date).days <= 3:
        streak_status = "at_risk"
    else:
        streak_status = "inactive"

    return {
        "user_id": user_id,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_activity": last_activity,
        "streak_status": streak_status,
    }
