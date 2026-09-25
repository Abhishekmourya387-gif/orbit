from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.onboarding_controller import read_onboarding, update_onboarding
from app.core.security import get_current_user
from app.db.session import get_db
from app.schemas.onboarding import OnboardingResponse, OnboardingUpdate

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


@router.get("", response_model=OnboardingResponse)
def get_user_onboarding(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return read_onboarding(db, current_user.id)


@router.put("", response_model=OnboardingResponse, status_code=status.HTTP_200_OK)
def save_user_onboarding(
    payload: OnboardingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return update_onboarding(db, current_user.id, payload)
