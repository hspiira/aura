"""ETL: copy performance_summaries into analytics fact table (star schema)."""

import logging

from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.repositories.fact_performance_summary_repo import (
    FactPerformanceSummaryRepository,
)
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)
from app.infrastructure.persistence.repositories.performance_summary_repo import (
    PerformanceSummaryRepository,
)
from app.infrastructure.persistence.repositories.user_repo import UserRepository

logger = logging.getLogger(__name__)


async def run_fact_performance_summary_etl(
    summary_repo: PerformanceSummaryRepository,
    user_repo: UserRepository,
    cycle_repo: PerformanceCycleRepository,
    fact_repo: FactPerformanceSummaryRepository,
) -> int:
    """Copy summaries into fact_performance_summary. Returns count upserted."""
    summaries = await summary_repo.list_all()
    user_ids = {s.user_id for s in summaries}
    cycle_ids = {s.performance_cycle_id for s in summaries}

    users = await user_repo.list_all()
    users_by_id = {u.id: u for u in users if u.id in user_ids}

    cycles = await cycle_repo.list_all()
    cycles_by_id = {c.id: c for c in cycles if c.id in cycle_ids}

    count = 0
    for s in summaries:
        user = users_by_id.get(s.user_id)
        cycle = cycles_by_id.get(s.performance_cycle_id)
        if user is None or cycle is None:
            logger.warning(
                "Skipping performance_summary %s: user_id=%s cycle_id=%s "
                "(missing user or cycle)",
                getattr(s, "id", None),
                s.user_id,
                s.performance_cycle_id,
            )
            continue
        cycle_year = cycle.start_date.year
        existing = await fact_repo.get_by_user_cycle(s.user_id, s.performance_cycle_id)
        if existing is not None:
            existing.department_id = user.department_id
            existing.role_id = user.role_id
            existing.cycle_year = cycle_year
            existing.quantitative_score = s.quantitative_score
            existing.behavioral_score = s.behavioral_score
            existing.final_score = s.final_weighted_score
            existing.rating_band = s.final_rating_band
            await fact_repo.refresh(existing)
        else:
            fact = FactPerformanceSummary(
                user_id=s.user_id,
                department_id=user.department_id,
                role_id=user.role_id,
                performance_cycle_id=s.performance_cycle_id,
                cycle_year=cycle_year,
                quantitative_score=s.quantitative_score,
                behavioral_score=s.behavioral_score,
                final_score=s.final_weighted_score,
                rating_band=s.final_rating_band,
            )
            await fact_repo.upsert(fact)
        count += 1
    return count
