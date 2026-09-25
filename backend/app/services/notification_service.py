from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.notification_repository import (
    create_notification_record,
    get_notification_by_id,
    get_notifications_by_user,
)
from app.repositories.user_repository import get_user_by_id


def create_notification(
    db: Session,
    user_id: int,
    *,
    title: str,
    message: str,
    notification_type: str = "info",
):
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    notification = create_notification_record(
        db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    return notification


def get_notifications_for_user(db: Session, user_id: int) -> list[dict]:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    notifications = get_notifications_by_user(db, user_id)
    return [
        {
            "id": item.id,
            "user_id": item.user_id,
            "title": item.title,
            "message": item.message,
            "notification_type": item.notification_type,
            "is_read": item.is_read,
            "created_at": item.created_at,
        }
        for item in notifications
    ]


def mark_notification_read(db: Session, user_id: int, notification_id: int) -> dict:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    notification = get_notification_by_id(db, notification_id)
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    if notification.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this notification",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    unread_count = sum(
        1
        for item in get_notifications_by_user(db, user_id)
        if not item.is_read
    )

    return {
        "id": notification.id,
        "user_id": notification.user_id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
        "unread_count": unread_count,
    }
