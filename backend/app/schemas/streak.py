from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StreakResponse(BaseModel):
    user_id: int
    current_streak: int = 0
    longest_streak: int = 0
    last_activity: datetime | None = None
    streak_status: str = "inactive"

    model_config = ConfigDict(from_attributes=True)
