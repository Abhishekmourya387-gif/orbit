from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.challenge import ChallengeCompleteRequest, ChallengeJoinRequest
from app.services.challenge_service import complete_challenge, get_challenge_summary, join_challenge


def read_challenges(db: Session, current_user: User):
    return get_challenge_summary(db, current_user.id)


def assign_challenge(db: Session, current_user: User, payload: ChallengeJoinRequest):
    return join_challenge(db, current_user.id, payload.challenge_name)


def finish_challenge(db: Session, current_user: User, payload: ChallengeCompleteRequest):
    return complete_challenge(db, current_user.id, payload.challenge_name)
