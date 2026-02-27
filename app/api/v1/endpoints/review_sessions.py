"""Review session endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_review_session_repo, require_permission
from app.api.v1.helpers import get_one_or_raise
from app.domain.permissions import MANAGE_REVIEW_SESSIONS
from app.infrastructure.persistence.models.review_session import ReviewSession
from app.infrastructure.persistence.repositories.review_session_repo import (
    ReviewSessionRepository,
)
from app.schemas.review_session import (
    ReviewSessionCreate,
    ReviewSessionResponse,
)

router = APIRouter()


@router.get("", response_model=list[ReviewSessionResponse])
async def list_review_sessions(
    repo: Annotated[ReviewSessionRepository, Depends(get_review_session_repo)],
    user_id: str | None = Query(None),
    performance_cycle_id: str | None = Query(None),
) -> list[ReviewSessionResponse]:
    """List review sessions; filter by user_id and/or performance_cycle_id when set."""
    if user_id and performance_cycle_id:
        items = await repo.list_by_user_cycle(user_id, performance_cycle_id)
    elif user_id:
        items = await repo.list_by_user(user_id)
    elif performance_cycle_id:
        items = await repo.list_by_cycle(performance_cycle_id)
    else:
        items = await repo.list_all()
    return [ReviewSessionResponse.model_validate(i) for i in items]


@router.post("", response_model=ReviewSessionResponse, status_code=201)
async def create_review_session(
    payload: ReviewSessionCreate,
    repo: Annotated[ReviewSessionRepository, Depends(get_review_session_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_REVIEW_SESSIONS))],
) -> ReviewSessionResponse:
    """Create a review session."""
    session = ReviewSession(
        user_id=payload.user_id,
        performance_cycle_id=payload.performance_cycle_id,
        reviewer_id=payload.reviewer_id,
        session_type=payload.session_type,
        status=payload.status,
        scheduled_at=payload.scheduled_at,
    )
    session = await repo.add(session)
    return ReviewSessionResponse.model_validate(session)


@router.get("/{id}", response_model=ReviewSessionResponse)
async def get_review_session(
    id: str,
    repo: Annotated[ReviewSessionRepository, Depends(get_review_session_repo)],
) -> ReviewSessionResponse:
    """Get one review session by id."""
    session = await get_one_or_raise(repo.get_by_id(id), id, "ReviewSession")
    return ReviewSessionResponse.model_validate(session)
