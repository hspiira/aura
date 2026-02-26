"""Objective score endpoints (read-only)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_objective_score_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.repositories.objective_score_repo import (
    ObjectiveScoreRepository,
)
from app.schemas.objective_score import ObjectiveScoreResponse

router = APIRouter()


@router.get("/by-objective/{objective_id}", response_model=ObjectiveScoreResponse)
async def get_score_for_objective(
    objective_id: str,
    repo: Annotated[ObjectiveScoreRepository, Depends(get_objective_score_repo)],
) -> ObjectiveScoreResponse:
    """Get the score for an objective (if calculated)."""
    score = await repo.get_by_objective(objective_id)
    if score is None:
        raise ResourceNotFoundException("ObjectiveScore", objective_id)
    return ObjectiveScoreResponse.model_validate(score)


@router.get("/{id}", response_model=ObjectiveScoreResponse)
async def get_objective_score(
    id: str,
    repo: Annotated[ObjectiveScoreRepository, Depends(get_objective_score_repo)],
) -> ObjectiveScoreResponse:
    """Get one objective score by id."""
    score = await repo.get_by_id(id)
    if score is None:
        raise ResourceNotFoundException("ObjectiveScore", id)
    return ObjectiveScoreResponse.model_validate(score)
