"""Behavioral score endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies import (
    get_behavioral_indicator_repo,
    get_behavioral_score_repo,
)
from app.api.v1.helpers import get_one_or_raise
from app.infrastructure.persistence.models.behavioral_score import BehavioralScore
from app.infrastructure.persistence.repositories.behavioral_indicator_repo import (
    BehavioralIndicatorRepository,
)
from app.infrastructure.persistence.repositories.behavioral_score_repo import (
    BehavioralScoreRepository,
)
from app.schemas.behavioral_score import (
    BehavioralScoreCreate,
    BehavioralScoreResponse,
)

router = APIRouter()


@router.get("", response_model=list[BehavioralScoreResponse])
async def list_behavioral_scores(
    repo: Annotated[BehavioralScoreRepository, Depends(get_behavioral_score_repo)],
    user_id: str | None = Query(None),
    performance_cycle_id: str | None = Query(None),
) -> list[BehavioralScoreResponse]:
    """List scores; filter by user_id and/or performance_cycle_id when provided."""
    if user_id and performance_cycle_id:
        items = await repo.list_by_user_cycle(user_id, performance_cycle_id)
    else:
        items = await repo.list_all()
        if user_id:
            items = [i for i in items if i.user_id == user_id]
        elif performance_cycle_id:
            items = [i for i in items if i.performance_cycle_id == performance_cycle_id]
    return [BehavioralScoreResponse.model_validate(i) for i in items]


@router.post("", response_model=BehavioralScoreResponse, status_code=201)
async def create_behavioral_score(
    payload: BehavioralScoreCreate,
    repo: Annotated[BehavioralScoreRepository, Depends(get_behavioral_score_repo)],
    indicator_repo: Annotated[
        BehavioralIndicatorRepository, Depends(get_behavioral_indicator_repo)
    ],
) -> BehavioralScoreResponse:
    """Create a behavioral score (rating within indicator's scale for user/cycle)."""
    indicator = await indicator_repo.get_by_id(payload.indicator_id)
    if indicator is None:
        raise HTTPException(
            404, f"BehavioralIndicator {payload.indicator_id!r} not found"
        )
    if (
        payload.rating < indicator.rating_scale_min
        or payload.rating > indicator.rating_scale_max
    ):
        raise HTTPException(
            400,
            f"rating must be between {indicator.rating_scale_min} and "
            f"{indicator.rating_scale_max} for this indicator (got {payload.rating})",
        )
    score = BehavioralScore(
        user_id=payload.user_id,
        performance_cycle_id=payload.performance_cycle_id,
        indicator_id=payload.indicator_id,
        rating=payload.rating,
        manager_comment=payload.manager_comment,
    )
    score = await repo.add(score)
    return BehavioralScoreResponse.model_validate(score)


@router.get("/{id}", response_model=BehavioralScoreResponse)
async def get_behavioral_score(
    id: str,
    repo: Annotated[BehavioralScoreRepository, Depends(get_behavioral_score_repo)],
) -> BehavioralScoreResponse:
    """Get one behavioral score by id."""
    score = await get_one_or_raise(repo.get_by_id(id), id, "BehavioralScore")
    return BehavioralScoreResponse.model_validate(score)
