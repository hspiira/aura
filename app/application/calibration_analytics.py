"""Calibration analytics service: distribution and variance by department."""

from collections import Counter, defaultdict
from decimal import Decimal
from math import sqrt
from collections.abc import Iterable

from pydantic import BaseModel

from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.repositories.fact_performance_summary_repo import (
    FactPerformanceSummaryRepository,
)


class DistributionBucket(BaseModel):
    label: str
    count: int
    percentage: float


class VarianceItem(BaseModel):
    department_id: str
    mean_score: float
    std_dev: float
    is_outlier: bool


async def _list_for_cycle(
    repo: FactPerformanceSummaryRepository,
    cycle_id: str,
    department_id: str | None,
) -> list[FactPerformanceSummary]:
    """Helper: fetch fact rows for a given cycle (and optional department)."""
    return await repo.list_for_cycle(
        performance_cycle_id=cycle_id,
        department_id=department_id,
    )


def _score_to_bucket_label(score: Decimal | None) -> str:
    if score is None:
        return "unknown"
    value = float(score)
    if value < 60:
        return "<60"
    if value < 70:
        return "60-69"
    if value < 80:
        return "70-79"
    if value < 90:
        return "80-89"
    return "90-100"


async def get_distribution(
    repo: FactPerformanceSummaryRepository,
    cycle_id: str,
    department_id: str | None,
) -> list[DistributionBucket]:
    """Return rating distribution buckets for a cycle (and optional department)."""
    rows = await _list_for_cycle(repo, cycle_id, department_id)
    if not rows:
        return []

    counter: Counter[str] = Counter(_score_to_bucket_label(r.final_score) for r in rows)
    total = sum(counter.values())
    buckets: list[DistributionBucket] = []
    for label in ["<60", "60-69", "70-79", "80-89", "90-100", "unknown"]:
        count = counter.get(label, 0)
        if count == 0 and label == "unknown":
            continue
        percentage = (count / total) * 100 if total else 0.0
        buckets.append(
            DistributionBucket(label=label, count=count, percentage=percentage)
        )
    return buckets


def _compute_mean_std(values: Iterable[float]) -> tuple[float, float]:
    seq = list(values)
    if not seq:
        return 0.0, 0.0
    mean = sum(seq) / len(seq)
    if len(seq) == 1:
        return mean, 0.0
    variance = sum((v - mean) ** 2 for v in seq) / len(seq)
    return mean, sqrt(variance)


async def get_variance(
    repo: FactPerformanceSummaryRepository,
    cycle_id: str,
    department_id: str | None,
    mean_threshold: float = 90.0,
    std_threshold: float = 5.0,
) -> list[VarianceItem]:
    """Return variance statistics by department for a cycle."""
    rows = await _list_for_cycle(repo, cycle_id, department_id)
    if not rows:
        return []

    scores_by_dept: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        if row.final_score is None:
            continue
        scores_by_dept[row.department_id].append(float(row.final_score))

    items: list[VarianceItem] = []
    for dept_id, scores in scores_by_dept.items():
        mean, std = _compute_mean_std(scores)
        # Flag as outlier only when scores are both high and tightly clustered.
        is_outlier = mean > mean_threshold and std < std_threshold
        items.append(
            VarianceItem(
                department_id=dept_id,
                mean_score=mean,
                std_dev=std,
                is_outlier=is_outlier,
            )
        )
    return items
