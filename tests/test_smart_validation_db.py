"""DB-backed tests for SMART validation and validate endpoint."""

from datetime import date
from decimal import Decimal

import pytest

from app.domain.smart_validation import (
    has_baseline_for_user_cycle_template,
    validate_objective,
)
from app.infrastructure.persistence.models.baseline_snapshot import (
    BaselineSnapshot,
)
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.repositories.baseline_snapshot_repo import (
    BaselineSnapshotRepository,
)
from app.infrastructure.persistence.repositories.objective_repo import (
    ObjectiveRepository,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.infrastructure.persistence.repositories.performance_cycle_repo import (
    PerformanceCycleRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_validate_objective_title_too_short_from_db(
    db_session, seed_phase1
) -> None:
    """SMART validation fails when title is shorter than min length (DB template)."""
    cycle_repo = PerformanceCycleRepository(db_session)
    template_repo = ObjectiveTemplateRepository(db_session)

    cycle = await cycle_repo.get_by_id(seed_phase1["performance_cycle_id"])
    assert cycle is not None

    template = ObjectiveTemplate(
        code="kpi-revenue",
        title="Revenue target",
        dimension_id=seed_phase1["dimension_id"],
        kpi_type="number",
        default_weight=Decimal("100"),
        min_target=Decimal("0"),
        max_target=Decimal("1000000"),
        requires_baseline_snapshot=False,
        is_active=True,
    )
    template = await template_repo.add(template)

    result = validate_objective(
        title="Short",
        kpi_type="number",
        target_value=Decimal("100"),
        weight=Decimal("100"),
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any("title" in e.lower() and "10" in e for e in result.errors)


@pytest.mark.asyncio
async def test_validate_objective_weight_sum_not_100(db_session, seed_phase1) -> None:
    """SMART validation fails when weight total is not 100%."""
    cycle_repo = PerformanceCycleRepository(db_session)
    template_repo = ObjectiveTemplateRepository(db_session)

    cycle = await cycle_repo.get_by_id(seed_phase1["performance_cycle_id"])
    assert cycle is not None

    template = ObjectiveTemplate(
        code="kpi-other",
        title="Other objective",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("50"),
        is_active=True,
    )
    template = await template_repo.add(template)

    result = validate_objective(
        title="A long enough objective title here",
        kpi_type=None,
        target_value=None,
        weight=Decimal("50"),
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any("weight" in e.lower() and "100" in e for e in result.errors)


@pytest.mark.asyncio
async def test_validate_objective_kpi_type_must_match_template(
    db_session, seed_phase1
) -> None:
    """SMART validation fails when objective kpi_type does not match template."""
    cycle_repo = PerformanceCycleRepository(db_session)
    template_repo = ObjectiveTemplateRepository(db_session)

    cycle = await cycle_repo.get_by_id(seed_phase1["performance_cycle_id"])
    assert cycle is not None

    template = ObjectiveTemplate(
        code="kpi-percent",
        title="Percent template",
        dimension_id=seed_phase1["dimension_id"],
        kpi_type="percent",
        default_weight=Decimal("100"),
        is_active=True,
    )
    template = await template_repo.add(template)

    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="number",
        target_value=Decimal("80"),
        weight=Decimal("100"),
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any("match template" in e and "percent" in e for e in result.errors)


@pytest.mark.asyncio
async def test_validate_objective_target_below_min(db_session, seed_phase1) -> None:
    """SMART validation fails when target_value is below template min_target."""
    cycle_repo = PerformanceCycleRepository(db_session)
    template_repo = ObjectiveTemplateRepository(db_session)

    cycle = await cycle_repo.get_by_id(seed_phase1["performance_cycle_id"])
    assert cycle is not None

    template = ObjectiveTemplate(
        code="kpi-minmax",
        title="Min/max template",
        dimension_id=seed_phase1["dimension_id"],
        kpi_type="number",
        default_weight=Decimal("100"),
        min_target=Decimal("10"),
        max_target=Decimal("100"),
        is_active=True,
    )
    template = await template_repo.add(template)

    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="number",
        target_value=Decimal("5"),
        weight=Decimal("100"),
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert result.valid is False
    assert any("min_target" in e or "below" in e for e in result.errors)


@pytest.mark.asyncio
async def test_validate_objective_requires_baseline_missing(
    db_session, seed_phase1
) -> None:
    """SMART validation fails when template requires baseline but none exists."""
    cycle_repo = PerformanceCycleRepository(db_session)
    template_repo = ObjectiveTemplateRepository(db_session)

    cycle = await cycle_repo.get_by_id(seed_phase1["performance_cycle_id"])
    assert cycle is not None

    template = ObjectiveTemplate(
        code="kpi-baseline",
        title="Requires baseline",
        dimension_id=seed_phase1["dimension_id"],
        kpi_type="number",
        default_weight=Decimal("100"),
        requires_baseline_snapshot=True,
        is_active=True,
    )
    template = await template_repo.add(template)

    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="number",
        target_value=Decimal("100"),
        weight=Decimal("100"),
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=False,
    )
    assert result.valid is False
    assert any("baseline" in e.lower() for e in result.errors)


@pytest.mark.asyncio
async def test_validate_objective_requires_baseline_present(
    db_session, seed_phase1
) -> None:
    """SMART validation passes baseline check when baseline is provided."""
    cycle_repo = PerformanceCycleRepository(db_session)
    template_repo = ObjectiveTemplateRepository(db_session)

    cycle = await cycle_repo.get_by_id(seed_phase1["performance_cycle_id"])
    assert cycle is not None

    template = ObjectiveTemplate(
        code="kpi-baseline-ok",
        title="Requires baseline",
        dimension_id=seed_phase1["dimension_id"],
        kpi_type="number",
        default_weight=Decimal("100"),
        requires_baseline_snapshot=True,
        is_active=True,
    )
    template = await template_repo.add(template)

    result = validate_objective(
        title="A long enough objective title here",
        kpi_type="number",
        target_value=Decimal("100"),
        weight=Decimal("100"),
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=Decimal("0"),
        has_baseline_for_template=True,
    )
    assert "baseline" not in [e.lower() for e in result.errors]
    assert result.valid is True


@pytest.mark.asyncio
async def test_has_baseline_for_user_cycle_template_with_db_baselines(
    db_session, seed_phase1
) -> None:
    """has_baseline_for_user_cycle_template returns True when baseline exists."""
    template_repo = ObjectiveTemplateRepository(db_session)
    baseline_repo = BaselineSnapshotRepository(db_session)

    template = ObjectiveTemplate(
        code="kpi-b",
        title="B",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        requires_baseline_snapshot=True,
        is_active=True,
    )
    template = await template_repo.add(template)

    snapshot = BaselineSnapshot(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        template_id=template.id,
        baseline_value=Decimal("50"),
        snapshot_date=date(2026, 1, 1),
        data_source="system",
    )
    await baseline_repo.add(snapshot)
    await db_session.flush()

    baselines = await baseline_repo.list_by_user_cycle(
        seed_phase1["user_id"],
        seed_phase1["performance_cycle_id"],
    )
    assert (
        has_baseline_for_user_cycle_template(
            baselines,
            seed_phase1["user_id"],
            seed_phase1["performance_cycle_id"],
            template.id,
        )
        is True
    )
    assert (
        has_baseline_for_user_cycle_template(
            baselines,
            seed_phase1["user_id"],
            seed_phase1["performance_cycle_id"],
            "other-template-id",
        )
        is False
    )


@pytest.mark.asyncio
async def test_validate_endpoint_returns_errors_when_invalid(
    db_session, seed_phase1, override_db_dependency
) -> None:
    """POST /objectives/validate returns valid=False and errors when invalid."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    template_repo = ObjectiveTemplateRepository(db_session)
    obj_repo = ObjectiveRepository(db_session)

    template = ObjectiveTemplate(
        code="kpi-e",
        title="Endpoint test",
        dimension_id=seed_phase1["dimension_id"],
        default_weight=Decimal("100"),
        is_active=True,
    )
    template = await template_repo.add(template)

    objective = Objective(
        user_id=seed_phase1["user_id"],
        performance_cycle_id=seed_phase1["performance_cycle_id"],
        dimension_id=seed_phase1["dimension_id"],
        template_id=template.id,
        title="Short",
        weight=Decimal("100"),
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
    )
    objective = await obj_repo.add(objective)
    await db_session.flush()

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/v1/objectives/validate",
                json={"objective_id": objective.id},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert isinstance(data["errors"], list)
        assert len(data["errors"]) > 0
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
