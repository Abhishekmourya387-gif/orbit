from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.leaderboard_service import get_leaderboard_summary


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_leaderboard_summary_returns_ranked_users():
    db = build_session()

    user_a = register_user(
        db,
        RegisterRequest(
            full_name="Ari Orbit",
            email="ari@example.com",
            password="StrongPass123!",
        ),
    )
    user_b = register_user(
        db,
        RegisterRequest(
            full_name="Bea Orbit",
            email="bea@example.com",
            password="StrongPass123!",
        ),
    )
    user_c = register_user(
        db,
        RegisterRequest(
            full_name="Cleo Orbit",
            email="cleo@example.com",
            password="StrongPass123!",
        ),
    )

    user_a.xp_points = 260
    user_a.level = 3
    user_b.xp_points = 420
    user_b.level = 5
    user_c.xp_points = 180
    user_c.level = 2
    db.commit()

    summary = get_leaderboard_summary(db, user_a.id)

    assert summary["user_id"] == user_a.id
    assert summary["rank"] >= 1
    assert len(summary["leaders"]) >= 3
    assert summary["leaders"][0]["full_name"] == "Bea Orbit"
    assert summary["leaders"][0]["xp_points"] >= 100
    assert summary["top_3_count"] == min(3, len(summary["leaders"]))
