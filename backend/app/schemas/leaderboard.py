from pydantic import BaseModel, ConfigDict


class LeaderboardEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    user_id: int
    full_name: str
    xp_points: int
    level: int
    current_streak: int


class LeaderboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    rank: int
    top_3_count: int
    leaders: list[LeaderboardEntryResponse]
    total_users: int
