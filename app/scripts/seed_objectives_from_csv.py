"""Seed performance dimensions and objective templates from organisation CSV.

Run from repo root with DATABASE_URL set:

    uv run python -m app.scripts.seed_objectives_from_csv

Optional: pass path to CSV (default: mimi/references/Objective Templates.csv):

    uv run python -m app.scripts.seed_objectives_from_csv path/to/templates.csv

Idempotent: creates dimensions by pillar name if missing; creates templates by code
if missing. Re-running will not duplicate.
"""

import asyncio
import csv
import os
import sys
from decimal import Decimal

from app.infrastructure.persistence import database as db_module
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.models.performance_dimension import (
    PerformanceDimension,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.infrastructure.persistence.repositories.performance_dimension_repo import (
    PerformanceDimensionRepository,
)

# Default CSV path relative to repo root (when run as: uv run python -m app.scripts.seed_objectives_from_csv)
DEFAULT_CSV_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "mimi", "references", "Objective Templates.csv"
)

# Normalise pillar names for consistency (e.g. fix typo)
PILLAR_NORMALISE = {
    "Operational Excelence": "Operational Excellence",
}

# Pillar name -> short code for template codes (e.g. CS_01)
PILLAR_CODE = {
    "Client Service": "CS",
    "Financial": "FIN",
    "Talent Management": "TM",
    "Operational Excellence": "OE",
}


def _normalise_pillar(name: str) -> str:
    return PILLAR_NORMALISE.get(name.strip(), name.strip())


def _pillar_code(pillar: str) -> str:
    return PILLAR_CODE.get(pillar, "OT")  # OT = other


def _parse_weight(raw: str) -> Decimal:
    """Parse Weights column; empty -> 0."""
    s = (raw or "").strip()
    if not s:
        return Decimal("0")
    try:
        return Decimal(s)
    except Exception:
        return Decimal("0")


def _kpi_type_from_target(target: str) -> str | None:
    """Return 'percent' if target looks like a percentage, else None."""
    if not target or "%" not in target:
        return None
    return "percent"


def _description(objective: str, target: str) -> str:
    """Build template description from Objective and Target."""
    parts = []
    if (objective or "").strip():
        parts.append((objective or "").strip())
    if (target or "").strip():
        parts.append((target or "").strip())
    return " | ".join(parts) if parts else ""


def _template_code(pillar: str, activity: str, row_index: int) -> str:
    """Unique template code: pillar abbrev + 1-based index (e.g. CS_01)."""
    code = _pillar_code(pillar)
    return f"{code}_{row_index:02d}"


async def _ensure_dimensions(
    dim_repo: PerformanceDimensionRepository,
    pillar_names: list[str],
) -> dict[str, str]:
    """Ensure performance dimensions exist for each pillar. Return pillar_name -> dimension_id."""
    existing = await dim_repo.list_all()
    by_name = {d.name: d.id for d in existing}
    out = {}
    for name in pillar_names:
        if name in by_name:
            out[name] = by_name[name]
            continue
        dim = PerformanceDimension(
            name=name,
            is_quantitative=True,
            default_weight_pct=Decimal("0"),
        )
        dim = await dim_repo.add(dim)
        by_name[dim.name] = dim.id
        out[dim.name] = dim.id
    return out


async def run(csv_path: str) -> None:
    """Read CSV, ensure dimensions and templates."""
    if not os.path.isfile(csv_path):
        print(f"File not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    pillars_seen: set[str] = set()
    rows: list[tuple[str, str, str, str, str]] = []  # pillar, objective, target, activity, weights

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if header and "Pillar" not in header[0]:
            print("Expected CSV header: Pillar, Objective, Target, Activity, ..., Weights", file=sys.stderr)
            sys.exit(1)
        for row in reader:
            if len(row) < 4:
                continue
            pillar = _normalise_pillar(row[0])
            objective = (row[1] or "").strip()
            target = (row[2] or "").strip()
            activity = (row[3] or "").strip()
            weights = row[5] if len(row) > 5 else ""
            if not activity and not target and not objective:
                continue
            if not activity:
                activity = target or objective or "Unnamed"
            pillars_seen.add(pillar)
            rows.append((pillar, objective, target, activity, weights))

    pillar_list = sorted(pillars_seen)
    if not pillar_list:
        print("No rows to import.", file=sys.stderr)
        sys.exit(1)

    db_module._ensure_engine()
    if db_module.AsyncSessionLocal is None:
        print("DATABASE_URL not set. Set it in .env or environment.", file=sys.stderr)
        sys.exit(1)

    async with db_module.AsyncSessionLocal() as session:
        async with session.begin():
            dim_repo = PerformanceDimensionRepository(session)
            tmpl_repo = ObjectiveTemplateRepository(session)

            dimension_ids = await _ensure_dimensions(dim_repo, pillar_list)
            print(f"Dimensions ensured: {list(dimension_ids.keys())}")

            existing_templates = await tmpl_repo.list_all()
            by_code = {t.code: t for t in existing_templates}

            created = 0
            for i, (pillar, objective, target, activity, weights_raw) in enumerate(rows, start=1):
                code = _template_code(pillar, activity, i)
                if code in by_code:
                    continue
                dimension_id = dimension_ids[pillar]
                default_weight = _parse_weight(weights_raw)
                description = _description(objective, target)
                kpi_type = _kpi_type_from_target(target)

                template = ObjectiveTemplate(
                    code=code,
                    version=1,
                    title=activity[:255],
                    description=description[:2000] if description else None,
                    dimension_id=dimension_id,
                    kpi_type=kpi_type,
                    default_weight=default_weight,
                    min_target=None,
                    max_target=None,
                    requires_baseline_snapshot=False,
                    is_active=True,
                )
                template = await tmpl_repo.add(template)
                by_code[template.code] = template
                created += 1

            print(f"Templates created: {created} (total rows in CSV: {len(rows)})")


def main() -> None:
    csv_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV_PATH
    csv_path = os.path.abspath(csv_path)
    asyncio.run(run(csv_path))


if __name__ == "__main__":
    main()
