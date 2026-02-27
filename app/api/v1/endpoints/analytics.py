"""Analytics endpoints (read-only fact + ETL refresh)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_fact_performance_summary_repo,
    get_performance_cycle_repo,
    get_performance_summary_repo,
    get_user_repo,
)
from app.application.analytics_etl import run_fact_performance_summary_etl
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
from app.schemas.fact_performance_summary import FactPerformanceSummaryResponse

router = APIRouter()


@router.get(
    "/fact-performance-summaries",
    response_model=list[FactPerformanceSummaryResponse],
)
async def list_fact_performance_summaries(
    repo: Annotated[
        FactPerformanceSummaryRepository,
        Depends(get_fact_performance_summary_repo),
    ],
    cycle_year: int | None = Query(None, description="Filter by cycle year"),
    department_id: str | None = Query(None, description="Filter by department"),
    limit: int = Query(1000, ge=1, le=5000),
) -> list[FactPerformanceSummaryResponse]:
    """List analytics fact rows (rating distribution, trends)."""
    items = await repo.list_all(
        cycle_year=cycle_year,
        department_id=department_id,
        limit=limit,
    )
    return [FactPerformanceSummaryResponse.model_validate(i) for i in items]


@router.post("/refresh")
async def refresh_analytics_etl(
    summary_repo: Annotated[
        PerformanceSummaryRepository, Depends(get_performance_summary_repo)
    ],
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
    cycle_repo: Annotated[
        PerformanceCycleRepository, Depends(get_performance_cycle_repo)
    ],
    fact_repo: Annotated[
        FactPerformanceSummaryRepository,
        Depends(get_fact_performance_summary_repo),
    ],
) -> dict[str, int]:
    """Run ETL: copy performance_summaries into fact_performance_summary. Returns count."""
    count = await run_fact_performance_summary_etl(
        summary_repo, user_repo, cycle_repo, fact_repo
    )
    return {"upserted": count}
