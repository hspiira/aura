"""Behavioral indicator endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_behavioral_indicator_repo, require_permission
from app.api.v1.helpers import get_one_or_raise
from app.domain.permissions import MANAGE_BEHAVIORAL
from app.infrastructure.persistence.models.behavioral_indicator import (
    BehavioralIndicator,
)
from app.infrastructure.persistence.repositories.behavioral_indicator_repo import (
    BehavioralIndicatorRepository,
)
from app.schemas.behavioral_indicator import (
    BehavioralIndicatorCreate,
    BehavioralIndicatorResponse,
)

router = APIRouter()


@router.get("", response_model=list[BehavioralIndicatorResponse])
async def list_behavioral_indicators(
    repo: Annotated[
        BehavioralIndicatorRepository, Depends(get_behavioral_indicator_repo)
    ],
    dimension_id: str | None = Query(None),
) -> list[BehavioralIndicatorResponse]:
    """List all behavioral indicators; optionally filter by dimension_id."""
    if dimension_id:
        items = await repo.list_by_dimension(dimension_id)
    else:
        items = await repo.list_all()
    return [BehavioralIndicatorResponse.model_validate(i) for i in items]


@router.post("", response_model=BehavioralIndicatorResponse, status_code=201)
async def create_behavioral_indicator(
    payload: BehavioralIndicatorCreate,
    repo: Annotated[
        BehavioralIndicatorRepository, Depends(get_behavioral_indicator_repo)
    ],
    _perm: Annotated[None, Depends(require_permission(MANAGE_BEHAVIORAL))],
) -> BehavioralIndicatorResponse:
    """Create a behavioral indicator."""
    indicator = BehavioralIndicator(
        dimension_id=payload.dimension_id,
        name=payload.name,
        description=payload.description,
        rating_scale_min=payload.rating_scale_min,
        rating_scale_max=payload.rating_scale_max,
        is_active=payload.is_active,
    )
    indicator = await repo.add(indicator)
    return BehavioralIndicatorResponse.model_validate(indicator)


@router.get("/{id}", response_model=BehavioralIndicatorResponse)
async def get_behavioral_indicator(
    id: str,
    repo: Annotated[
        BehavioralIndicatorRepository, Depends(get_behavioral_indicator_repo)
    ],
) -> BehavioralIndicatorResponse:
    """Get one behavioral indicator by id."""
    indicator = await get_one_or_raise(repo.get_by_id(id), id, "BehavioralIndicator")
    return BehavioralIndicatorResponse.model_validate(indicator)
