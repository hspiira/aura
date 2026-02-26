"""Performance summary request/response schemas."""

from decimal import Decimal

from pydantic import BaseModel


class PerformanceSummaryResponse(BaseModel):
    """Performance summary in API responses."""

    id: str
    user_id: str
    performance_cycle_id: str
    quantitative_score: Decimal | None
    behavioral_score: Decimal | None
    final_weighted_score: Decimal | None
    final_rating_band: str | None
    manager_comment: str | None
    employee_comment: str | None
    hr_approved: bool

    model_config = {"from_attributes": True}


class ComputeSummaryRequest(BaseModel):
    """Request to compute summary for a user and cycle."""

    user_id: str
    performance_cycle_id: str


class PerformanceSummaryUpdate(BaseModel):
    """Payload to update comments and rating band."""

    final_rating_band: str | None = None
    manager_comment: str | None = None
    employee_comment: str | None = None
    hr_approved: bool | None = None
