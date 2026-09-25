from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes.auth_routes import router as auth_router
from app.routes.challenge_routes import router as challenge_router
from app.routes.checkin_routes import router as checkin_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.goal_routes import router as goal_router
from app.routes.habit_routes import router as habit_router
from app.routes.insight_routes import router as insight_router
from app.routes.leaderboard_routes import router as leaderboard_router
from app.routes.notification_routes import router as notification_router
from app.routes.onboarding_routes import router as onboarding_router
from app.routes.focus_routes import router as focus_router
from app.routes.profile_routes import router as profile_router
from app.routes.rescue_routes import router as rescue_router
from app.routes.streak_routes import router as streak_router
from app.routes.xp_routes import router as xp_router


app = FastAPI(
    title="Orbit API",
    version="1.0.0",
)

origins = [
    origin.strip()
    for origin in settings.BACKEND_CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(rescue_router)
app.include_router(onboarding_router)
app.include_router(checkin_router)
app.include_router(dashboard_router)
app.include_router(habit_router)
app.include_router(goal_router)
app.include_router(streak_router)
app.include_router(focus_router)
app.include_router(xp_router)
app.include_router(challenge_router)
app.include_router(notification_router)
app.include_router(insight_router)
app.include_router(leaderboard_router)


@app.get("/")
def home():
    return {
        "message": "Orbit API is running"
    }