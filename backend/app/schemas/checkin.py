from pydantic import BaseModel, ConfigDict, Field


class DailyCheckInCreate(BaseModel):
    mood: str | None = None
    energy_level: int | None = None
    focus_rating: int | None = None
    reflection: str | None = None
    win_of_day: str | None = None
    blockers: list[str] = Field(default_factory=list)


class DailyCheckInResponse(BaseModel):
    id: int
    user_id: int
    mood: str | None = None
    energy_level: int | None = None
    focus_rating: int | None = None
    reflection: str | None = None
    win_of_day: str | None = None
    blockers: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
