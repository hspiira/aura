"""ETL: copy performance_summaries into analytics fact table (star schema)."""

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


async def run_fact_performance_summary_etl(
    summary_repo: PerformanceSummaryRepository,
    user_repo: UserRepository,
    cycle_repo: PerformanceCycleRepository,
    fact_repo: FactPerformanceSummaryRepository,
) -> int:
    """Copy all performance summaries into fact_performance_summary. Returns count upserted."""
    summaries = await summary_repo.list_all()
    count = 0
    for s in summaries:
        user = await user_repo.get_by_id(s.user_id)
        cycle = await cycle_repo.get_by_id(s.performance_cycle_id)
        if user is None or cycle is None:
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
