from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.controllers.challenge_controller import assign_challenge, finish_challenge, read_challenges
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.challenge import ChallengeCompleteRequest, ChallengeJoinRequest, ChallengeResultResponse, ChallengeSummaryResponse

router = APIRouter(prefix="/api/v1/challenges", tags=["Challenges"])


@router.get("", response_model=ChallengeSummaryResponse, status_code=status.HTTP_200_OK)
def get_challenges_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_challenges(db=db, current_user=current_user)


@router.post("/join", response_model=dict, status_code=status.HTTP_200_OK)
def join_challenge_endpoint(
    payload: ChallengeJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return assign_challenge(db=db, current_user=current_user, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/complete", response_model=ChallengeResultResponse, status_code=status.HTTP_200_OK)
def complete_challenge_endpoint(
    payload: ChallengeCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return finish_challenge(db=db, current_user=current_user, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
