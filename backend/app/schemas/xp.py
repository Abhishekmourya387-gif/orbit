from datetime import datetime

from pydantic import BaseModel, ConfigDict


class XpAwardRequest(BaseModel):
    amount: int
    source: str = "manual"
    description: str | None = None


class XpActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    source: str
    xp_amount: int
    description: str | None = None
    created_at: datetime


class XpSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    total_xp: int
    level: int
    xp_to_next_level: int
    progress_percentage: float
    badges: list[str]
    recent_activities: list[XpActivityResponse]
