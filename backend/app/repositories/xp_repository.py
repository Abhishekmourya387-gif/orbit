from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.xp_activity import XpActivity


def create_xp_activity(
    db: Session,
    *,
    user_id: int,
    source: str,
    xp_amount: int,
    description: str | None = None,
) -> XpActivity:
    activity = XpActivity(
        user_id=user_id,
        source=source,
        xp_amount=xp_amount,
        description=description,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def get_recent_xp_activities_by_user(db: Session, user_id: int, limit: int = 5) -> list[XpActivity]:
    statement = (
        select(XpActivity)
        .where(XpActivity.user_id == user_id)
        .order_by(XpActivity.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(statement).all())
