"""Application lifespan: startup and shutdown."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.application.scheduled_jobs import (
    run_objectives_lock_job,
    run_stale_update_flags_job,
)
from app.infrastructure.persistence.database import _ensure_engine, engine

# When running multiple Uvicorn workers, run the scheduler in a single process
# (e.g. a dedicated worker or set workers=1) so the lock/flag jobs run once.


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan context: ensure DB engine, start scheduler, dispose on shutdown."""
    try:
        _ensure_engine()
    except Exception:
        pass
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_objectives_lock_job,
        "cron",
        hour=2,
        minute=0,
        id="objectives_lock",
    )
    scheduler.add_job(
        run_stale_update_flags_job,
        "cron",
        hour=3,
        minute=0,
        id="stale_update_flags",
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    if engine is not None:
        engine.sync_engine.dispose()
