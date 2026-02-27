"""DB-backed tests for DimCycle (analytics dimension) and its constraints."""

from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.infrastructure.persistence.models.dim_cycle import DimCycle

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_dim_cycle_rejects_end_before_start(db_session) -> None:
    """Inserting DimCycle with end_date < start_date raises IntegrityError."""
    row = DimCycle(
        cycle_id="constraint-test-cycle",
        name="Invalid range",
        cycle_year=2026,
        start_date=date(2026, 12, 31),
        end_date=date(2026, 1, 1),
    )
    db_session.add(row)
    with pytest.raises(IntegrityError):
        await db_session.flush()
