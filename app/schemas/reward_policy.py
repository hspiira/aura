"""Reward policy request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class RewardPolicyCreate(BaseModel):
    """Payload to create a reward policy band."""

    min_score: Decimal
    max_score: Decimal
    reward_type: str
    reward_value: str


class RewardPolicyResponse(BaseModel):
    """Reward policy in API responses."""

    id: str
    min_score: Decimal
    max_score: Decimal
    reward_type: str
    reward_value: str

    model_config = {"from_attributes": True}
