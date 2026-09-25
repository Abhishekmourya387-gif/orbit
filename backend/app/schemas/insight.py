from pydantic import BaseModel, ConfigDict


class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    headline: str
    focus_score: int
    energy_trend: str
    average_focus: float
    average_energy: float
    current_streak: int
    xp_level: int
    recommendations: list[str]
