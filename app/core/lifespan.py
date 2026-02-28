"""Application lifespan: startup and shutdown."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.application.scheduled_jobs import (
    run_notification_outbox_job,
    run_objectives_lock_job,
    run_stale_update_flags_job,
)
from app.infrastructure.persistence import database as db
from app.scripts.seed_admin import ensure_admin_user

# When running multiple Uvicorn workers, run the scheduler in a single process
# (e.g. a dedicated worker or set workers=1) so the lock/flag jobs run once.


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan: ensure DB engine, ensure admin user, start scheduler, dispose."""
    db._ensure_engine()
    try:
        await ensure_admin_user()
    except Exception as e:
        logging.getLogger(__name__).warning(
            "Could not ensure admin user on startup: %s", e
        )
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
    scheduler.add_job(
        run_notification_outbox_job,
        "interval",
        minutes=2,
        id="notification_outbox",
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    if db.engine is not None:
        await db.engine.dispose()
