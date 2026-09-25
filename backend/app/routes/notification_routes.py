from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.controllers.notification_controller import (
    read_notifications,
    send_notification,
    update_notification_read,
)
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationCreateRequest, NotificationResponse

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse], status_code=status.HTTP_200_OK)
def list_notifications_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_notifications(db=db, current_user=current_user)


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification_endpoint(
    payload: NotificationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return send_notification(db=db, current_user=current_user, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{notification_id}/read", response_model=dict, status_code=status.HTTP_200_OK)
def mark_notification_read_endpoint(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return update_notification_read(db=db, current_user=current_user, notification_id=notification_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
