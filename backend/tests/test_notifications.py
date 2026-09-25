from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.notification_service import create_notification, get_notifications_for_user, mark_notification_read


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_notification_flow_creates_lists_and_marks_read():
    db = build_session()
    user = register_user(
        db,
        RegisterRequest(
            full_name="Ari Orbit",
            email="ari@example.com",
            password="StrongPass123!",
        ),
    )

    notification = create_notification(
        db,
        user.id,
        title="Habit check-in reminder",
        message="Your evening reflection is due.",
        notification_type="reminder",
    )

    assert notification.title == "Habit check-in reminder"
    assert notification.is_read is False

    notifications = get_notifications_for_user(db, user.id)
    assert len(notifications) == 1
    assert notifications[0]["title"] == "Habit check-in reminder"

    updated = mark_notification_read(db, user.id, notification.id)
    assert updated["is_read"] is True
    assert updated["unread_count"] == 0
