from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.insight_controller import read_insights
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.insight import InsightResponse

router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


@router.get("", response_model=InsightResponse, status_code=status.HTTP_200_OK)
def get_insights_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return read_insights(db=db, current_user=current_user)
