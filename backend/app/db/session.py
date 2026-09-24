"""Database connection utility for OnionVision AI.
Provides asynchronous connection pool, session lifecycle, and table initialization
supporting both PostgreSQL (asyncpg) and Async SQLite (aiosqlite).
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from sqlalchemy.orm import DeclarativeBase
from ..config import settings

class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass

# Determine engine parameters based on database driver
engine_kwargs = {
    "echo": settings.DB_ECHO_SQL,
    "future": True,
}

# PostgreSQL connection pool tuning
if settings.DATABASE_URL.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    })

# Create asynchronous database engine
async_engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Asynchronous session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for injecting an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db() -> None:
    """Initializes tables in the database schema asynchronously."""
    async with async_engine.begin() as conn:
        # Import models here to ensure metadata registration
        from . import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

async def close_db() -> None:
    """Closes all database connections in the connection pool."""
    await async_engine.dispose()
