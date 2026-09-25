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


def test_rescue_history_is_authenticated_and_private():
    session_factory, db = build_database()
    user = register_user(
        db,
        RegisterRequest(full_name="Rescue User", email="rescue@example.com", password="StrongPass123!"),
    )
    other_user = register_user(
        db,
        RegisterRequest(full_name="Other User", email="other@example.com", password="StrongPass123!"),
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
        created = client.post(
            "/api/v1/rescue/sessions",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"activity_type": "breathing", "duration_seconds": 30, "completed": True},
        )
        assert created.status_code == 201
        assert created.json()["activity_type"] == "breathing"
        assert created.json()["user_id"] == user.id

        own_history = client.get(
            "/api/v1/rescue/history",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert own_history.status_code == 200
        assert len(own_history.json()) == 1

        other_history = client.get(
            "/api/v1/rescue/history",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        assert other_history.status_code == 200
        assert other_history.json() == []

        unauthenticated = client.get("/api/v1/rescue/history")
        assert unauthenticated.status_code == 401
    finally:
        app.dependency_overrides.clear()
        client.close()
