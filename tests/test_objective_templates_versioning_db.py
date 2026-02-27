"""DB tests for objective template versioning behavior."""

import pytest

from app.infrastructure.persistence.models.objective_template import ObjectiveTemplate
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.anyio
async def test_create_new_version_increments_version_and_deactivates_old(
    db_session, seed_phase1
):
    repo = ObjectiveTemplateRepository(db_session)

    base = ObjectiveTemplate(
        code="REV_GROWTH",
        title="Revenue growth",
        description=None,
        dimension_id=seed_phase1["dimension_id"],
        kpi_type=None,
        default_weight=1,
        min_target=None,
        max_target=None,
        requires_baseline_snapshot=False,
        is_active=True,
        version=1,
    )
    db_session.add(base)
    await db_session.flush()
    await db_session.refresh(base)

    new_template = await repo.create_new_version(
        base_template=base,
        updated_fields={"title": "Revenue growth v2"},
    )

    assert new_template.id != base.id
    assert new_template.code == base.code
    assert new_template.version == base.version + 1
    assert new_template.title == "Revenue growth v2"
    assert new_template.is_active is True

    assert base.is_active is False
    assert base.superseded_by_id == new_template.id
