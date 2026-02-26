"""Behavioral score endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_behavioral_score_repo
from app.api.v1.helpers import get_one_or_raise
from app.infrastructure.persistence.models.behavioral_score import BehavioralScore
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
    repo: Annotated[
        BehavioralScoreRepository, Depends(get_behavioral_score_repo)
    ],
    user_id: str | None = Query(None),
    performance_cycle_id: str | None = Query(None),
) -> list[BehavioralScoreResponse]:
    """List scores; filter by user_id and performance_cycle_id when both set."""
    if user_id and performance_cycle_id:
        items = await repo.list_by_user_cycle(user_id, performance_cycle_id)
    else:
        items = await repo.list_all()
    return [BehavioralScoreResponse.model_validate(i) for i in items]


@router.post("", response_model=BehavioralScoreResponse, status_code=201)
async def create_behavioral_score(
    payload: BehavioralScoreCreate,
    repo: Annotated[
        BehavioralScoreRepository, Depends(get_behavioral_score_repo)
    ],
) -> BehavioralScoreResponse:
    """Create a behavioral score (rating 1–5 for user/cycle/indicator)."""
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
    repo: Annotated[
        BehavioralScoreRepository, Depends(get_behavioral_score_repo)
    ],
) -> BehavioralScoreResponse:
    """Get one behavioral score by id."""
    score = await get_one_or_raise(repo.get_by_id(id), id, "BehavioralScore")
    return BehavioralScoreResponse.model_validate(score)
