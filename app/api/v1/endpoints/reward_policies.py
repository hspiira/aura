"""Reward policy endpoints."""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_reward_policy_repo,
    require_permission,
)
from app.api.v1.helpers import get_one_or_raise
from app.core.audit import audit_log
from app.core.auth import CurrentUserIdOptional
from app.domain.exceptions import ResourceNotFoundException
from app.domain.permissions import MANAGE_REWARD_POLICY
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.reward_policy_repo import (
    RewardPolicyRepository,
)
from app.schemas.reward_policy import RewardPolicyCreate, RewardPolicyResponse

router = APIRouter()


@router.get("", response_model=list[RewardPolicyResponse])
async def list_reward_policies(
    repo: Annotated[RewardPolicyRepository, Depends(get_reward_policy_repo)],
    _perm: Annotated[None, Depends(require_permission(MANAGE_REWARD_POLICY))],
) -> list[RewardPolicyResponse]:
    """List all reward policy bands."""
    items = await repo.list_all()
    return [RewardPolicyResponse.model_validate(i) for i in items]


@router.post("", response_model=RewardPolicyResponse, status_code=201)
async def create_reward_policy(
    payload: RewardPolicyCreate,
    repo: Annotated[RewardPolicyRepository, Depends(get_reward_policy_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    _perm: Annotated[None, Depends(require_permission(MANAGE_REWARD_POLICY))],
) -> RewardPolicyResponse:
    """Create a reward policy band."""
    existing = await repo.list_all()
    has_overlap = any(
        not (p.max_score < payload.min_score or p.min_score > payload.max_score)
        for p in existing
    )
    if has_overlap:
        raise HTTPException(
            409,
            "reward policy band overlaps an existing band",
        )

    from app.infrastructure.persistence.models.reward_policy import (
        RewardPolicy,
    )

    policy = RewardPolicy(
        min_score=payload.min_score,
        max_score=payload.max_score,
        reward_type=payload.reward_type,
        reward_value=payload.reward_value,
    )
    policy = await repo.add(policy)
    await audit_log(
        audit_repo,
        "reward_policy",
        policy.id,
        "create",
        new_value={"reward_type": policy.reward_type},
        changed_by=changed_by,
    )
    return RewardPolicyResponse.model_validate(policy)


@router.get("/band", response_model=RewardPolicyResponse)
async def get_reward_policy_band_for_score(
    score: Annotated[Decimal, Query(description="Performance score to look up")],
    repo: Annotated[RewardPolicyRepository, Depends(get_reward_policy_repo)],
) -> RewardPolicyResponse:
    """Return the policy band containing the score (min<=score<=max). 404 if none."""
    policy = await repo.find_band_for_score(score)
    if policy is None:
        raise ResourceNotFoundException(
            "RewardPolicy",
            f"band for score {score}",
        )
    return RewardPolicyResponse.model_validate(policy)


@router.get("/{id}", response_model=RewardPolicyResponse)
async def get_reward_policy(
    id: str,
    repo: Annotated[RewardPolicyRepository, Depends(get_reward_policy_repo)],
) -> RewardPolicyResponse:
    """Get one reward policy by id."""
    policy = await get_one_or_raise(repo.get_by_id(id), id, "RewardPolicy")
    return RewardPolicyResponse.model_validate(policy)
