"""Application service: compute performance summary scores (spec B.3)."""

from decimal import Decimal

from app.infrastructure.persistence.models.performance_summary import (
    PerformanceSummary,
)
from app.infrastructure.persistence.repositories.behavioral_score_repo import (
    BehavioralScoreRepository,
)
from app.infrastructure.persistence.repositories.objective_score_repo import (
    ObjectiveScoreRepository,
)
from app.infrastructure.persistence.repositories.performance_summary_repo import (
    PerformanceSummaryRepository,
)

QUANT_WEIGHT = Decimal("0.8")
BEHAVIORAL_WEIGHT = Decimal("0.2")
RATING_SCALE_MAX = 5


async def compute_and_save_summary(
    user_id: str,
    performance_cycle_id: str,
    objective_score_repo: ObjectiveScoreRepository,
    behavioral_score_repo: BehavioralScoreRepository,
    summary_repo: PerformanceSummaryRepository,
) -> PerformanceSummary:
    """Compute quant/behavioral/final scores and create or update summary.

    Quantitative = sum of objective_scores.weighted_score for user/cycle.
    Behavioral % = (avg rating / 5) * 100 over behavioral_scores for user/cycle.
    Final = quant * 0.8 + behavioral_pct * 0.2 (spec 80/20).
    """
    quant = await objective_score_repo.sum_weighted_score_for_user_cycle(
        user_id, performance_cycle_id
    )
    scores = await behavioral_score_repo.list_by_user_cycle(
        user_id, performance_cycle_id
    )
    if scores:
        avg_rating = sum(s.rating for s in scores) / len(scores)
        behavioral_pct = (Decimal(str(avg_rating)) / RATING_SCALE_MAX) * 100
        behavioral_pct = round(behavioral_pct, 2)
    else:
        behavioral_pct = Decimal("0")
    final = quant * QUANT_WEIGHT + behavioral_pct * BEHAVIORAL_WEIGHT
    final = round(final, 2)

    existing = await summary_repo.get_by_user_cycle(
        user_id, performance_cycle_id
    )
    if existing:
        return await summary_repo.update_scores(
            existing,
            quantitative_score=quant,
            behavioral_score=behavioral_pct,
            final_weighted_score=final,
        )
    summary = PerformanceSummary(
        user_id=user_id,
        performance_cycle_id=performance_cycle_id,
        quantitative_score=quant,
        behavioral_score=behavioral_pct,
        final_weighted_score=final,
    )
    return await summary_repo.add(summary)
