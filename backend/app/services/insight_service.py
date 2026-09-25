from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import get_user_by_id
from app.services.checkin_service import get_recent_checkins
from app.services.focus_service import get_focus_analytics
from app.services.streak_service import get_streak_summary
from app.services.xp_service import get_xp_summary


def _average(values: list[int]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 2)


def _energy_trend_from_checkins(checkins: list) -> str:
    if len(checkins) < 2:
        return "steady"

    values = [
        checkin.energy_level
        for checkin in checkins[:2]
        if checkin.energy_level is not None
    ]
    if len(values) < 2:
        return "steady"
    if values[0] < values[-1]:
        return "up"
    if values[0] > values[-1]:
        return "down"
    return "steady"


def get_insight_summary(db: Session, user_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    recent_checkins = get_recent_checkins(db, user_id, limit=7)
    focus_analytics = get_focus_analytics(db, user_id)
    streak_summary = get_streak_summary(db, user_id)
    xp_summary = get_xp_summary(db, user_id)

    focus_values = [
        checkin.focus_rating
        for checkin in recent_checkins
        if checkin.focus_rating is not None
    ]
    energy_values = [
        checkin.energy_level
        for checkin in recent_checkins
        if checkin.energy_level is not None
    ]

    avg_focus = _average(focus_values)
    avg_energy = _average(energy_values)
    focus_score = int(max(0, min(100, round((avg_focus / 10) * 100))))

    if streak_summary["current_streak"] >= 3:
        headline = "You are building strong momentum."
    elif focus_score >= 70:
        headline = "Your focus is trending up."
    elif avg_energy >= 7:
        headline = "You have solid energy today."
    else:
        headline = "A small reset could help you regain traction."

    recommendations = [
        "Keep your check-ins consistent to protect your current streak.",
        "Use one short focus block before midday to turn your strongest energy into output.",
    ]

    if focus_analytics["completed_sessions"] == 0:
        recommendations.append("Start with a 25-minute focus session on your highest-priority task.")
    elif focus_analytics["average_session_minutes"] < 30:
        recommendations.append("Extend one session by 10 to 15 minutes to deepen your flow state.")
    else:
        recommendations.append("Repeat the session structure that already works for you and protect it.")

    if xp_summary["total_xp"] >= 200:
        recommendations.append("Your XP momentum is strong; use it to complete one challenge and keep climbing.")

    return {
        "user_id": user_id,
        "headline": headline,
        "focus_score": focus_score,
        "energy_trend": _energy_trend_from_checkins(recent_checkins),
        "average_focus": avg_focus,
        "average_energy": avg_energy,
        "current_streak": streak_summary["current_streak"],
        "xp_level": xp_summary["level"],
        "recommendations": recommendations[:4],
    }
