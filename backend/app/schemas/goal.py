from pydantic import BaseModel, ConfigDict


class GoalCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "active"
    target_date: str | None = None
    progress: int = 0


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None = None
    status: str = "active"
    target_date: str | None = None
    progress: int = 0

    model_config = ConfigDict(from_attributes=True)
