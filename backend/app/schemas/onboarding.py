from pydantic import BaseModel, ConfigDict, Field


class OnboardingUpdate(BaseModel):
    primary_goal: str | None = None
    current_challenges: list[str] = Field(default_factory=list)
    common_triggers: list[str] = Field(default_factory=list)
    preferred_routine: str | None = None
    focus_goals: str | None = None
    improvement_goals: str | None = None


class OnboardingResponse(BaseModel):
    id: int
    user_id: int
    primary_goal: str | None = None
    current_challenges: list[str] = Field(default_factory=list)
    common_triggers: list[str] = Field(default_factory=list)
    preferred_routine: str | None = None
    focus_goals: str | None = None
    improvement_goals: str | None = None

    model_config = ConfigDict(from_attributes=True)
