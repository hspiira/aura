"""Domain-layer structural protocols (PEP 544).

Infrastructure models satisfy these implicitly.
"""

from decimal import Decimal
from typing import Protocol, runtime_checkable


@runtime_checkable
class ObjectiveTemplateProtocol(Protocol):
    """Fields of ObjectiveTemplate needed by domain validation."""

    kpi_type: str | None
    min_target: Decimal | None
    max_target: Decimal | None
    requires_baseline_snapshot: bool


@runtime_checkable
class BaselineSnapshotProtocol(Protocol):
    """Fields of BaselineSnapshot needed by domain helpers."""

    user_id: str
    performance_cycle_id: str
    template_id: str
