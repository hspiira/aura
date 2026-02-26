"""SQLAlchemy mixins for CUID primary key and timezone-aware timestamps."""

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, declared_attr, mapped_column
from sqlalchemy.sql import func

from app.shared.utils import generate_cuid


class CuidMixin:
    """Mixin for models using CUID2 as primary key."""

    @declared_attr
    def id(cls) -> Mapped[str]:
        return mapped_column(String, primary_key=True, default=generate_cuid)


class TimestampMixin:
    """Mixin for created_at and updated_at (timezone-aware UTC)."""

    @declared_attr
    def created_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
        )

    @declared_attr
    def updated_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
