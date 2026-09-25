from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RescueActivityType = Literal["breathing", "pushups", "movement", "grounding", "stretch", "cool_water"]


class RescueSessionCreate(BaseModel):
    activity_type: RescueActivityType
    duration_seconds: int = Field(default=0, ge=0, le=3600)
    completed: bool = False


class RescueSessionResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    duration_seconds: int
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
