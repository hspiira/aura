"""Role dimension weight repository."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.role_dimension_weight import (
    RoleDimensionWeight,
)


class RoleDimensionWeightRepository:
    """Repository for RoleDimensionWeight entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[RoleDimensionWeight]:
        """Return all role dimension weights."""
        result = await self._session.execute(
            select(RoleDimensionWeight).order_by(
                RoleDimensionWeight.role_id,
                RoleDimensionWeight.dimension_id,
            )
        )
        return list(result.scalars().all())

    async def list_by_role(self, role_id: str) -> list[RoleDimensionWeight]:
        """Return weights for a role."""
        result = await self._session.execute(
            select(RoleDimensionWeight)
            .where(RoleDimensionWeight.role_id == role_id)
            .order_by(RoleDimensionWeight.dimension_id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, id: str) -> RoleDimensionWeight | None:
        """Return one weight by id."""
        result = await self._session.execute(
            select(RoleDimensionWeight).where(RoleDimensionWeight.id == id)
        )
        return result.scalar_one_or_none()

    async def add(
        self, role_dimension_weight: RoleDimensionWeight
    ) -> RoleDimensionWeight:
        """Persist a role dimension weight."""
        self._session.add(role_dimension_weight)
        await self._session.flush()
        await self._session.refresh(role_dimension_weight)
        return role_dimension_weight

    async def update(
        self, weight_id: str, *, weight_pct: Decimal
    ) -> RoleDimensionWeight | None:
        """Update weight_pct by id. Returns None if not found."""
        weight = await self.get_by_id(weight_id)
        if weight is None:
            return None
        weight.weight_pct = weight_pct
        await self._session.flush()
        await self._session.refresh(weight)
        return weight

    async def delete(self, weight: RoleDimensionWeight) -> None:
        """Delete a role dimension weight."""
        await self._session.delete(weight)
