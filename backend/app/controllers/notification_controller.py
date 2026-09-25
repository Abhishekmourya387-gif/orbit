from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.notification import NotificationCreateRequest
from app.services.notification_service import create_notification, get_notifications_for_user, mark_notification_read


def read_notifications(db: Session, current_user: User):
    return get_notifications_for_user(db, current_user.id)


def send_notification(db: Session, current_user: User, payload: NotificationCreateRequest):
    return create_notification(
        db,
        current_user.id,
        title=payload.title,
        message=payload.message,
        notification_type=payload.notification_type,
    )


def update_notification_read(db: Session, current_user: User, notification_id: int):
    return mark_notification_read(db, current_user.id, notification_id)
