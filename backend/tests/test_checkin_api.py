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


def test_checkin_api_persists_and_scopes_entries_to_authenticated_user():
    session_factory, db = build_database()
    ava = register_user(
        db,
        RegisterRequest(full_name="Ava Orbit", email="ava@example.com", password="StrongPass123!"),
    )
    blake = register_user(
        db,
        RegisterRequest(full_name="Blake Orbit", email="blake@example.com", password="StrongPass123!"),
    )
    ava_email = ava.email
    blake_email = blake.email
    db.close()

    def override_get_db() -> Generator[Session, None, None]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    ava_token = create_access_token(ava_email)
    blake_token = create_access_token(blake_email)
    payload = {
        "mood": "focused",
        "energy_level": 8,
        "focus_rating": 9,
        "reflection": "Protected the most important work.",
        "win_of_day": "Finished the sprint plan.",
        "blockers": ["Email interruptions"],
    }

    try:
        created = client.post(
            "/api/v1/checkins",
            headers={"Authorization": f"Bearer {ava_token}"},
            json=payload,
        )
        assert created.status_code == 201
        assert created.json()["mood"] == "focused"
        assert created.json()["user_id"] == ava.id

        duplicate = client.post(
            "/api/v1/checkins",
            headers={"Authorization": f"Bearer {ava_token}"},
            json=payload,
        )
        assert duplicate.status_code == 409
        assert "already" in duplicate.json()["detail"].lower()

        blake_history = client.get(
            "/api/v1/checkins",
            headers={"Authorization": f"Bearer {blake_token}"},
        )
        assert blake_history.status_code == 200
        assert blake_history.json() == []

        unauthenticated = client.get("/api/v1/checkins")
        assert unauthenticated.status_code == 401
    finally:
        app.dependency_overrides.clear()
        client.close()
