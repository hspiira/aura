"""Scheduled governance jobs: auto-lock objectives by date, 90-day stale flags."""

import logging
from datetime import date, timedelta, timezone

from app.infrastructure.persistence.database import get_db_transactional
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_score import ObjectiveScore
from app.shared.utils.datetime import utc_now

logger = logging.getLogger(__name__)

STALE_DAYS = 90
STALE_FLAG_TYPE = "stale_update"


async def run_objectives_lock_job() -> None:
    """Lock all objectives for cycles whose objectives_lock_date has passed."""
    from app.infrastructure.persistence.repositories.audit_log_repo import (
        AuditLogRepository,
    )
    from app.infrastructure.persistence.repositories.objective_repo import (
        ObjectiveRepository,
    )
    from app.infrastructure.persistence.repositories.objective_score_repo import (
        ObjectiveScoreRepository,
    )
    from app.infrastructure.persistence.repositories.performance_cycle_repo import (
        PerformanceCycleRepository,
    )

    today = date.today()
    async for session in get_db_transactional():
        try:
            cycle_repo = PerformanceCycleRepository(session)
            objective_repo = ObjectiveRepository(session)
            score_repo = ObjectiveScoreRepository(session)
            audit_repo = AuditLogRepository(session)

            cycles = await cycle_repo.list_cycles_pending_objectives_lock(today)
            for cycle in cycles:
                objectives = await objective_repo.list_by_cycle(cycle.id)
                to_lock = [o for o in objectives if o.locked_at is None]
                now = utc_now()
                for obj in to_lock:
                    await objective_repo.set_locked_at(obj, now)
                    score = await score_repo.get_by_objective(obj.id)
                    if score is not None and not score.locked:
                        await score_repo.set_locked(score, locked=True)
                    await audit_repo.add(
                        entity_type="objective",
                        entity_id=obj.id,
                        action="lock",
                        new_value={"locked_at": now.isoformat()},
                        changed_by=None,
                    )
                if to_lock:
                    await cycle_repo.set_objectives_locked_at(cycle, now)
                    logger.info(
                        "Locked %d objectives for cycle %s",
                        len(to_lock),
                        cycle.id,
                    )
        # Single iteration: generator then exits and transaction commits.


async def run_stale_update_flags_job() -> None:
    """Set stale_update flag on objectives with no update in 90 days (unlocked only)."""
    from app.infrastructure.persistence.repositories.objective_flag_repo import (
        ObjectiveFlagRepository,
    )
    from app.infrastructure.persistence.repositories.objective_repo import (
        ObjectiveRepository,
    )
    from app.infrastructure.persistence.repositories.objective_update_repo import (
        ObjectiveUpdateRepository,
    )

    cutoff = utc_now() - timedelta(days=STALE_DAYS)
    async for session in get_db_transactional():
        try:
            objective_repo = ObjectiveRepository(session)
            update_repo = ObjectiveUpdateRepository(session)
            flag_repo = ObjectiveFlagRepository(session)

            last_update_map = await update_repo.get_last_update_at_by_objective()
            objectives = await objective_repo.list_all()
            unlocked = [o for o in objectives if o.locked_at is None]
            added = 0
            for obj in unlocked:
                last_activity = last_update_map.get(obj.id) or obj.created_at
                if not last_activity:
                    continue
                if last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)
                if last_activity < cutoff:
                    if not await flag_repo.has_flag(obj.id, STALE_FLAG_TYPE):
                        await flag_repo.add_flag(obj.id, STALE_FLAG_TYPE)
                        added += 1
            if added:
                logger.info("Set stale_update flag on %d objectives", added)
        # Single iteration: generator then exits and transaction commits.
