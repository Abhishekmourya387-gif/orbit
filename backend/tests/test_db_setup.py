from app.db.database import Base, engine
from app.models.user import User


def test_database_metadata_is_configured():
    assert "users" in Base.metadata.tables
    assert User.__tablename__ == "users"
    assert engine.url.drivername.startswith("postgresql")
