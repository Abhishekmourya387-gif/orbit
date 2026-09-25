from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services.auth_service import (
    get_user_profile,
    login_user,
    refresh_user_tokens,
    register_user,
)


def register(
    db: Session,
    user_data: RegisterRequest,
):
    return register_user(
        db=db,
        user_data=user_data,
    )


def login(
    db: Session,
    email: str,
    password: str,
):
    return login_user(
        db=db,
        email=email,
        password=password,
    )


def get_current_profile(
    db: Session,
    current_user: User,
):
    return get_user_profile(db=db, email=current_user.email)


def refresh(
    db: Session,
    refresh_token: str,
):
    return refresh_user_tokens(
        db=db,
        refresh_token=refresh_token,
    )