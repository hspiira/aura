"""Application lifespan: startup and shutdown."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.infrastructure.persistence.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan context: dispose DB engine on shutdown if it was created."""
    yield
    if engine is not None:
        engine.sync_engine.dispose()
