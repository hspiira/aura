"""ObjectiveFlag repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models.objective_flag import ObjectiveFlag
from app.shared.utils.datetime import utc_now


class ObjectiveFlagRepository:
    """Repository for ObjectiveFlag."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def has_flag(self, objective_id: str, flag_type: str) -> bool:
        """Return True if this objective already has this flag type."""
        result = await self._session.execute(
            select(ObjectiveFlag).where(
                ObjectiveFlag.objective_id == objective_id,
                ObjectiveFlag.flag_type == flag_type,
            )
        )
        return result.scalar_one_or_none() is not None

    async def add_flag(self, objective_id: str, flag_type: str) -> ObjectiveFlag:
        """Append a flag (e.g. stale_update)."""
        flag = ObjectiveFlag(
            objective_id=objective_id,
            flag_type=flag_type,
            set_at=utc_now(),
        )
        self._session.add(flag)
        await self._session.flush()
        await self._session.refresh(flag)
        return flag
