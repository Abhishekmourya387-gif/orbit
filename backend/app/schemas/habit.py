from pydantic import BaseModel, ConfigDict, Field


class HabitCreate(BaseModel):
    title: str
    description: str | None = None
    frequency: str = "daily"
    streak: int = 0
    completed_today: bool = False


class HabitResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None = None
    frequency: str = "daily"
    streak: int = 0
    completed_today: bool = False

    model_config = ConfigDict(from_attributes=True)
