"""Shared API helpers (e.g. get-one-or-raise)."""

from collections.abc import Coroutine
from typing import TypeVar

from app.domain.exceptions import ResourceNotFoundException

T = TypeVar("T")


async def get_one_or_raise(
    coro: Coroutine[None, None, T | None],
    resource_id: str,
    resource_type: str,
) -> T:
    """Await coro; raise ResourceNotFoundException if result is None, else return it."""
    entity = await coro
    if entity is None:
        raise ResourceNotFoundException(resource_type, resource_id)
    return entity
