"""Analytics fact response schema (read-only)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class FactPerformanceSummaryResponse(BaseModel):
    """Fact row in API responses."""

    id: str
    user_id: str
    department_id: str
    role_id: str
    performance_cycle_id: str
    cycle_year: int
    quantitative_score: Decimal | None
    behavioral_score: Decimal | None
    final_score: Decimal | None
    rating_band: str | None
    etl_at: datetime

    model_config = {"from_attributes": True}
