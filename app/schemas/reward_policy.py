"""Reward policy request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel, model_validator


class RewardPolicyCreate(BaseModel):
    """Payload to create a reward policy band."""

    min_score: Decimal
    max_score: Decimal
    reward_type: str
    reward_value: str

    @model_validator(mode="after")
    def min_score_lte_max_score(self) -> "RewardPolicyCreate":
        """Enforce min_score <= max_score."""
        if self.min_score > self.max_score:
            raise ValueError("min_score must be less than or equal to max_score")
        return self


class RewardPolicyUpdate(BaseModel):
    """Payload to update a reward policy band (partial)."""

    min_score: Decimal | None = None
    max_score: Decimal | None = None
    reward_type: str | None = None
    reward_value: str | None = None

    @model_validator(mode="after")
    def min_score_lte_max_score(self) -> "RewardPolicyUpdate":
        """Enforce min_score <= max_score when both present."""
        if self.min_score is not None and self.max_score is not None:
            if self.min_score > self.max_score:
                raise ValueError("min_score must be less than or equal to max_score")
        return self


class RewardPolicyResponse(BaseModel):
    """Reward policy in API responses."""

    id: str
    min_score: Decimal
    max_score: Decimal
    reward_type: str
    reward_value: str

    model_config = {"from_attributes": True}
