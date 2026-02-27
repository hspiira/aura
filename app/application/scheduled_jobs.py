"""Scheduled governance jobs: auto-lock objectives by date, 90-day stale flags."""

import logging
from datetime import UTC, timedelta

from app.infrastructure.persistence.database import get_db_transactional
from app.shared.utils.datetime import utc_now

logger = logging.getLogger(__name__)

STALE_DAYS = 90
STALE_FLAG_TYPE = "stale_update"


async def run_objectives_lock_job() -> None:
    """Lock all objectives for cycles whose objectives_lock_date has passed."""
    from app.application.notification_service import emit_event
    from app.infrastructure.persistence.repositories.audit_log_repo import (
        AuditLogRepository,
    )
    from app.infrastructure.persistence.repositories.notification_log_repo import (
        NotificationLogRepository,
    )
    from app.infrastructure.persistence.repositories.notification_rule_repo import (
        NotificationRuleRepository,
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
    from app.infrastructure.persistence.repositories.user_repo import UserRepository

    today = utc_now().date()
    async for session in get_db_transactional():
        cycle_repo = PerformanceCycleRepository(session)
        objective_repo = ObjectiveRepository(session)
        score_repo = ObjectiveScoreRepository(session)
        audit_repo = AuditLogRepository(session)
        notification_rule_repo = NotificationRuleRepository(session)
        notification_log_repo = NotificationLogRepository(session)
        user_repo = UserRepository(session)
        users = await user_repo.list_all()

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
            await cycle_repo.set_objectives_locked_at(cycle, now)
            if to_lock:
                logger.info(
                    "Locked %d objectives for cycle %s",
                    len(to_lock),
                    cycle.id,
                )
                # Emit a single objective_locked event per cycle run
                # with summary context.
                await emit_event(
                    event_type="objective_locked",
                    context={
                        "performance_cycle_id": cycle.id,
                        "objective_ids": [o.id for o in to_lock],
                        "count": len(to_lock),
                    },
                    rule_repo=notification_rule_repo,
                    log_repo=notification_log_repo,
                    user_repo=user_repo,
                    pre_fetched_users=users,
                )


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
        objective_repo = ObjectiveRepository(session)
        update_repo = ObjectiveUpdateRepository(session)
        flag_repo = ObjectiveFlagRepository(session)

        last_update_map = await update_repo.get_last_update_at_by_objective()
        candidates = await objective_repo.list_unlocked_older_than(cutoff)

        existing_flags = await flag_repo.list_by_type(STALE_FLAG_TYPE)
        flagged_ids = {f.objective_id for f in existing_flags}

        added = 0
        for obj in candidates:
            last_activity = last_update_map.get(obj.id) or obj.created_at
            if not last_activity:
                continue
            if last_activity.tzinfo is None:
                last_activity = last_activity.replace(tzinfo=UTC)
            if last_activity < cutoff and obj.id not in flagged_ids:
                await flag_repo.add_flag(obj.id, STALE_FLAG_TYPE)
                added += 1
        if added:
            logger.info("Set stale_update flag on %d objectives", added)


async def run_notification_outbox_job() -> None:
    """Process pending notification outbox entries and deliver events."""
    from app.application.notification_service import emit_event
    from app.infrastructure.persistence.repositories.notification_log_repo import (
        NotificationLogRepository,
    )
    from app.infrastructure.persistence.repositories.notification_outbox_repo import (
        NotificationOutboxRepository,
    )
    from app.infrastructure.persistence.repositories.notification_rule_repo import (
        NotificationRuleRepository,
    )
    from app.infrastructure.persistence.repositories.user_repo import UserRepository

    retry_delay = timedelta(minutes=5)

    async for session in get_db_transactional():
        outbox_repo = NotificationOutboxRepository(session)
        rule_repo = NotificationRuleRepository(session)
        log_repo = NotificationLogRepository(session)
        user_repo = UserRepository(session)

        pending = await outbox_repo.list_pending(limit=50)
        if not pending:
            return

        users = await user_repo.list_all()

        for entry in pending:
            try:
                await emit_event(
                    event_type=entry.event_type,
                    context=entry.context,
                    rule_repo=rule_repo,
                    log_repo=log_repo,
                    user_repo=user_repo,
                    pre_fetched_users=users,
                )
            except Exception as exc:  # pragma: no cover - defensive
                await outbox_repo.mark_failed(entry, str(exc), retry_after=retry_delay)
                logger.exception(
                    "Failed to deliver notification_outbox entry %s: %s",
                    entry.id,
                    exc,
                )
            else:
                await outbox_repo.mark_delivered(entry)
