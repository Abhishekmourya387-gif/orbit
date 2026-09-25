from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.auth_controller import get_current_profile, login, refresh, register
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_endpoint(
    user_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    return register(db=db, user_data=user_data)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
def login_endpoint(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    return login(db=db, email=login_data.email, password=login_data.password)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def me_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_current_profile(db=db, current_user=current_user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
def refresh_endpoint(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    return refresh(db=db, refresh_token=refresh_data.refresh_token)