"""Performance summary endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_behavioral_score_repo,
    get_objective_score_repo,
    get_performance_summary_repo,
)
from app.api.v1.helpers import get_one_or_raise
from app.application.summary import compute_and_save_summary
from app.infrastructure.persistence.repositories.behavioral_score_repo import (
    BehavioralScoreRepository,
)
from app.infrastructure.persistence.repositories.objective_score_repo import (
    ObjectiveScoreRepository,
)
from app.infrastructure.persistence.repositories.performance_summary_repo import (
    PerformanceSummaryRepository,
)
from app.schemas.performance_summary import (
    ComputeSummaryRequest,
    PerformanceSummaryResponse,
    PerformanceSummaryUpdate,
)

router = APIRouter()


@router.get("", response_model=list[PerformanceSummaryResponse])
async def list_performance_summaries(
    repo: Annotated[
        PerformanceSummaryRepository, Depends(get_performance_summary_repo)
    ],
    user_id: str | None = Query(None),
    performance_cycle_id: str | None = Query(None),
) -> list[PerformanceSummaryResponse]:
    """List summaries; filter by user_id and/or performance_cycle_id when set."""
    items = await repo.list_all()
    if user_id:
        items = [i for i in items if i.user_id == user_id]
    if performance_cycle_id:
        items = [i for i in items if i.performance_cycle_id == performance_cycle_id]
    return [PerformanceSummaryResponse.model_validate(i) for i in items]


@router.get("/by-user-cycle", response_model=PerformanceSummaryResponse)
async def get_summary_by_user_cycle(
    repo: Annotated[
        PerformanceSummaryRepository, Depends(get_performance_summary_repo)
    ],
    user_id: str = Query(..., description="User id"),
    performance_cycle_id: str = Query(..., description="Performance cycle id"),
) -> PerformanceSummaryResponse:
    """Get summary for a user and cycle (404 if not found)."""
    summary = await repo.get_by_user_cycle(user_id, performance_cycle_id)
    if summary is None:
        from app.domain.exceptions import ResourceNotFoundException

        raise ResourceNotFoundException(
            "PerformanceSummary", f"{user_id}/{performance_cycle_id}"
        )
    return PerformanceSummaryResponse.model_validate(summary)


@router.post(
    "/compute",
    response_model=PerformanceSummaryResponse,
    status_code=201,
)
async def compute_summary(
    payload: ComputeSummaryRequest,
    objective_score_repo: Annotated[
        ObjectiveScoreRepository, Depends(get_objective_score_repo)
    ],
    behavioral_score_repo: Annotated[
        BehavioralScoreRepository, Depends(get_behavioral_score_repo)
    ],
    summary_repo: Annotated[
        PerformanceSummaryRepository, Depends(get_performance_summary_repo)
    ],
) -> PerformanceSummaryResponse:
    """Compute quant/behavioral/final scores and create or update summary."""
    summary = await compute_and_save_summary(
        payload.user_id,
        payload.performance_cycle_id,
        objective_score_repo,
        behavioral_score_repo,
        summary_repo,
    )
    return PerformanceSummaryResponse.model_validate(summary)


@router.get("/{id}", response_model=PerformanceSummaryResponse)
async def get_performance_summary(
    id: str,
    repo: Annotated[
        PerformanceSummaryRepository, Depends(get_performance_summary_repo)
    ],
) -> PerformanceSummaryResponse:
    """Get one performance summary by id."""
    summary = await get_one_or_raise(
        repo.get_by_id(id), id, "PerformanceSummary"
    )
    return PerformanceSummaryResponse.model_validate(summary)


@router.patch("/{id}", response_model=PerformanceSummaryResponse)
async def update_performance_summary(
    id: str,
    payload: PerformanceSummaryUpdate,
    repo: Annotated[
        PerformanceSummaryRepository, Depends(get_performance_summary_repo)
    ],
) -> PerformanceSummaryResponse:
    """Update rating band, comments, and/or hr_approved."""
    summary = await get_one_or_raise(
        repo.get_by_id(id), id, "PerformanceSummary"
    )
    summary = await repo.update_metadata(
        summary,
        final_rating_band=payload.final_rating_band,
        manager_comment=payload.manager_comment,
        employee_comment=payload.employee_comment,
        hr_approved=payload.hr_approved,
    )
    return PerformanceSummaryResponse.model_validate(summary)
