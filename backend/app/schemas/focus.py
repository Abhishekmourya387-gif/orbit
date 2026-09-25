from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FocusSessionCreate(BaseModel):
    goal: str = Field(min_length=3, max_length=255)
    duration_minutes: int = Field(default=25, ge=5, le=180)


class FocusSessionComplete(BaseModel):
    completed: bool = True
    notes: str | None = None


class FocusDistractionCreate(BaseModel):
    source: str | None = None
    note: str | None = None


class FocusEventResponse(BaseModel):
    id: int
    session_id: int
    event_type: str
    source: str | None = None
    note: str | None = None
    occurred_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FocusSessionResponse(BaseModel):
    id: int
    user_id: int
    goal: str
    duration_minutes: int
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    notes: str | None = None
    xp_awarded: int = 0
    distractions_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class FocusAnalyticsResponse(BaseModel):
    total_sessions: int
    completed_sessions: int
    total_minutes: int
    total_distractions: int
    average_session_minutes: float
    best_session_minutes: int
