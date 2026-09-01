"""Engine, sessão e Base declarativa do SQLAlchemy 2."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Base de todos os models."""


def get_db() -> Generator[Session, None, None]:
    """Dependência do FastAPI: abre uma sessão por requisição e sempre fecha."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
