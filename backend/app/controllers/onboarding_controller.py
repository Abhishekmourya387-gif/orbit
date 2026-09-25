from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.onboarding import OnboardingResponse, OnboardingUpdate
from app.services.onboarding_service import get_onboarding, save_onboarding


def read_onboarding(db: Session, user_id: int) -> OnboardingResponse:
    onboarding = get_onboarding(db, user_id)
    return OnboardingResponse.model_validate(onboarding)


def update_onboarding(db: Session, user_id: int, data: OnboardingUpdate) -> OnboardingResponse:
    payload = data.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No onboarding data provided",
        )
    onboarding = save_onboarding(db, user_id, payload)
    return OnboardingResponse.model_validate(onboarding)
