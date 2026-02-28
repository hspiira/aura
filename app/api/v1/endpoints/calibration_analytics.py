"""Calibration analytics endpoints: distribution and variance (read-only)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_fact_performance_summary_repo,
    require_permission,
)
from app.application.calibration_analytics import (
    DistributionBucket,
    VarianceItem,
    get_distribution,
    get_variance,
)
from app.domain.permissions import RUN_CALIBRATION
from app.infrastructure.persistence.repositories.fact_performance_summary_repo import (
    FactPerformanceSummaryRepository,
)

router = APIRouter()


@router.get("/distribution", response_model=list[DistributionBucket])
async def get_calibration_distribution(
    repo: Annotated[
        FactPerformanceSummaryRepository,
        Depends(get_fact_performance_summary_repo),
    ],
    _perm: Annotated[None, Depends(require_permission(RUN_CALIBRATION))],
    cycle_id: str = Query(..., description="Performance cycle ID"),
    department_id: str | None = Query(
        None,
        description="Optional department filter",
    ),
) -> list[DistributionBucket]:
    """Return distribution of final scores for a cycle (and optional department)."""
    return await get_distribution(repo, cycle_id=cycle_id, department_id=department_id)


@router.get("/variance", response_model=list[VarianceItem])
async def get_calibration_variance(
    repo: Annotated[
        FactPerformanceSummaryRepository,
        Depends(get_fact_performance_summary_repo),
    ],
    _perm: Annotated[None, Depends(require_permission(RUN_CALIBRATION))],
    cycle_id: str = Query(..., description="Performance cycle ID"),
    department_id: str | None = Query(
        None,
        description="Optional department filter",
    ),
) -> list[VarianceItem]:
    """Return variance statistics by department for a cycle."""
    return await get_variance(repo, cycle_id=cycle_id, department_id=department_id)
