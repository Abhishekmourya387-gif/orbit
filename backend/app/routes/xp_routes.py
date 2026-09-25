from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.controllers.xp_controller import grant_xp, read_xp_summary
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.xp import XpActivityResponse, XpAwardRequest, XpSummaryResponse

router = APIRouter(prefix="/api/v1/xp", tags=["XP"])


@router.get("", response_model=XpSummaryResponse, status_code=status.HTTP_200_OK)
def get_xp_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_xp_summary(db=db, current_user=current_user)


@router.post("/award", response_model=XpActivityResponse, status_code=status.HTTP_201_CREATED)
def award_xp_endpoint(
    payload: XpAwardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return grant_xp(db=db, current_user=current_user, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
