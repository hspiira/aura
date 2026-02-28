"""Clear all application data from the database (keeps schema and alembic_version).

Run from repo root with DATABASE_URL set:

    uv run python -m app.scripts.clear_db_data

Truncates all tables that are part of the ORM metadata in dependency-safe order
(RESTART IDENTITY CASCADE). Does not drop tables or touch alembic_version.
"""

import asyncio
import sys

from sqlalchemy import text

# Import so Base.metadata is populated with all model tables
import app.infrastructure.persistence.models as _models  # noqa: F401
from app.infrastructure.persistence.models.user_identity import UserIdentity  # noqa: F401
from app.infrastructure.persistence import database as db_module
from app.infrastructure.persistence.database import Base

assert _models  # ensure models are loaded


def _table_names() -> list[str]:
    """Return table names from ORM metadata (excludes alembic_version)."""
    return sorted(Base.metadata.tables.keys())


async def run() -> None:
    table_names = _table_names()
    if not table_names:
        print("No tables in metadata.", file=sys.stderr)
        sys.exit(1)

    db_module._ensure_engine()
    if db_module.AsyncSessionLocal is None:
        print("DATABASE_URL not set. Set it in .env or environment.", file=sys.stderr)
        sys.exit(1)

    # TRUNCATE ... RESTART IDENTITY CASCADE clears data and resets sequences.
    # CASCADE truncates any table with FK to these (covers all our app tables).
    quoted = ", ".join(f'"{t}"' for t in table_names)
    sql = f"TRUNCATE {quoted} RESTART IDENTITY CASCADE"

    async with db_module.AsyncSessionLocal() as session:
        await session.execute(text(sql))
        await session.commit()

    print(f"Cleared data in {len(table_names)} tables: {', '.join(table_names)}")


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
