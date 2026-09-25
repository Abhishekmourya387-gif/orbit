from pydantic import BaseModel, ConfigDict


class ChallengeJoinRequest(BaseModel):
    challenge_name: str


class ChallengeCompleteRequest(BaseModel):
    challenge_name: str


class ChallengeSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    available_challenges: list[str]
    active_challenges: list[str]
    completed_challenges: list[str]


class ChallengeResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    challenge_name: str
    completed: bool
    xp_awarded: int
