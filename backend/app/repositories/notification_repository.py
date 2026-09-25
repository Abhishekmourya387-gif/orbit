from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification


def get_notifications_by_user(db: Session, user_id: int) -> list[Notification]:
    statement = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    return list(db.scalars(statement).all())


def create_notification_record(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_notification_by_id(db: Session, notification_id: int) -> Notification | None:
    return db.get(Notification, notification_id)
