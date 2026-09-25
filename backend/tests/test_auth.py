from datetime import timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import login_user, register_user


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_password_hashing_and_verification():
    raw_password = "StrongPass123!"
    hashed_password = hash_password(raw_password)

    assert hashed_password != raw_password
    assert verify_password(raw_password, hashed_password) is True


def test_jwt_round_trip():
    token = create_access_token(subject="user@example.com", expires_delta=timedelta(minutes=30))
    payload = decode_token(token)

    assert payload["sub"] == "user@example.com"
    assert payload["type"] == "access"


def test_register_and_login_user():
    db = build_session()
    user_data = RegisterRequest(full_name="Ava Orbit", email="ava@example.com", password="StrongPass123!")

    created_user = register_user(db, user_data)
    assert created_user.email == "ava@example.com"
    assert created_user.password_hash != "StrongPass123!"

    token_data = login_user(db, "ava@example.com", "StrongPass123!")
    assert token_data["user"]["email"] == "ava@example.com"
    assert "access_token" in token_data
    assert "refresh_token" in token_data
