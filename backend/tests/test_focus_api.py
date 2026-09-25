from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.db.database import Base
from app.db.session import get_db
from app.main import app
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user


def build_database() -> tuple[sessionmaker[Session], Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return session_factory, session_factory()


def test_focus_api_lifecycle_and_session_ownership():
    session_factory, db = build_database()
    user = register_user(
        db,
        RegisterRequest(full_name="Focus User", email="focus@example.com", password="StrongPass123!"),
    )
    other_user = register_user(
        db,
        RegisterRequest(full_name="Other User", email="other-focus@example.com", password="StrongPass123!"),
    )
    user_email = user.email
    other_email = other_user.email
    db.close()

    def override_get_db() -> Generator[Session, None, None]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    user_token = create_access_token(user_email)
    other_token = create_access_token(other_email)

    try:
        started = client.post(
            "/api/v1/focus/start",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"goal": "Write the first draft", "duration_minutes": 5},
        )
        assert started.status_code == 201
        session_id = started.json()["id"]
        assert started.json()["status"] == "active"

        forbidden = client.post(
            f"/api/v1/focus/{session_id}/complete",
            headers={"Authorization": f"Bearer {other_token}"},
            json={"completed": True},
        )
        assert forbidden.status_code == 403

        distraction = client.post(
            f"/api/v1/focus/{session_id}/distraction",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"source": "phone"},
        )
        assert distraction.status_code == 201

        completed = client.post(
            f"/api/v1/focus/{session_id}/complete",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"completed": True, "notes": "Kept the first draft moving."},
        )
        assert completed.status_code == 200
        assert completed.json()["status"] == "completed"
        assert completed.json()["xp_awarded"] > 0

        analytics = client.get(
            "/api/v1/focus/analytics",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert analytics.status_code == 200
        assert analytics.json()["completed_sessions"] == 1
        assert analytics.json()["total_distractions"] == 1
    finally:
        app.dependency_overrides.clear()
        client.close()
