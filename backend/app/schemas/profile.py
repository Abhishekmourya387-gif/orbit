from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    bio: str | None = None
    primary_goal: str | None = None
    current_challenges: list[str] = Field(default_factory=list)
    preferred_habits: list[str] = Field(default_factory=list)
    focus_goals: str | None = None
    improvement_goals: str | None = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: str | None = None
    primary_goal: str | None = None
    current_challenges: list[str] = Field(default_factory=list)
    preferred_habits: list[str] = Field(default_factory=list)
    focus_goals: str | None = None
    improvement_goals: str | None = None
    profile_completion: int = 0

    model_config = ConfigDict(from_attributes=True)
