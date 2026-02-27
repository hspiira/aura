"""Analytics endpoints (read-only fact + ETL refresh)."""

import asyncio
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query

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

etl_lock = asyncio.Lock()
etl_status: dict[str, object] = {
    "running": False,
    "last_started_at": None,
    "last_finished_at": None,
    "last_upserted": None,
    "last_error": None,
}


async def _run_fact_etl_job(
    summary_repo: PerformanceSummaryRepository,
    user_repo: UserRepository,
    cycle_repo: PerformanceCycleRepository,
    fact_repo: FactPerformanceSummaryRepository,
) -> None:
    """Run fact ETL under a single-flight lock and record status."""
    async with etl_lock:
        etl_status["running"] = True
        etl_status["last_started_at"] = datetime.now(timezone.utc).isoformat()
        etl_status["last_error"] = None
        try:
            count = await run_fact_performance_summary_etl(
                summary_repo, user_repo, cycle_repo, fact_repo
            )
            etl_status["last_upserted"] = count
        except Exception as exc:  # pragma: no cover - surfaced via status endpoint
            etl_status["last_error"] = str(exc)
        finally:
            etl_status["running"] = False
            etl_status["last_finished_at"] = datetime.now(timezone.utc).isoformat()


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


@router.post("/refresh", status_code=202)
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
    background_tasks: BackgroundTasks,
) -> dict[str, object]:
    """Start ETL to copy performance_summaries into fact_performance_summary.

    Runs in the background with single-flight semantics; returns quickly with status.
    """
    if etl_lock.locked():
        return {
            "status": "in_progress",
            "last_started_at": etl_status["last_started_at"],
            "last_finished_at": etl_status["last_finished_at"],
            "last_upserted": etl_status["last_upserted"],
        }

    background_tasks.add_task(
        _run_fact_etl_job,
        summary_repo,
        user_repo,
        cycle_repo,
        fact_repo,
    )
    return {
        "status": "accepted",
        "last_started_at": etl_status["last_started_at"],
        "last_finished_at": etl_status["last_finished_at"],
        "last_upserted": etl_status["last_upserted"],
    }


@router.get("/refresh/status")
async def get_refresh_status() -> dict[str, object]:
    """Return current state of the analytics ETL refresh job."""
    return etl_status
