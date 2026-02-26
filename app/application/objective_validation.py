"""Application service: run SMART validation for an objective."""

from app.domain.smart_validation import validate_objective
from app.infrastructure.persistence.models.objective import Objective
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
from app.schemas.objective_validation import ValidateObjectiveResponse


async def run_smart_validation(
    objective: Objective,
    cycle_repo: PerformanceCycleRepository,
    template_repo: ObjectiveTemplateRepository,
    objective_repo: ObjectiveRepository,
    baseline_repo: BaselineSnapshotRepository,
) -> ValidateObjectiveResponse:
    """Load cycle, template, other weights, baseline; run SMART validation."""
    cycle = await cycle_repo.get_by_id(objective.performance_cycle_id)
    if not cycle:
        return ValidateObjectiveResponse(
            valid=False,
            errors=["performance cycle not found"],
        )
    template = None
    if objective.template_id:
        template = await template_repo.get_by_id(objective.template_id)
    other_weights = await objective_repo.sum_weight_for_user_cycle_excluding(
        user_id=objective.user_id,
        performance_cycle_id=objective.performance_cycle_id,
        exclude_objective_id=objective.id,
    )
    has_baseline = True
    if template and template.requires_baseline_snapshot:
        baseline = await baseline_repo.get_by_user_cycle_template(
            objective.user_id,
            objective.performance_cycle_id,
            objective.template_id,
        )
        has_baseline = baseline is not None
    result = validate_objective(
        title=objective.title,
        kpi_type=objective.kpi_type,
        target_value=objective.target_value,
        weight=objective.weight,
        start_date=objective.start_date,
        end_date=objective.end_date,
        cycle_start=cycle.start_date,
        cycle_end=cycle.end_date,
        template=template,
        other_weights_sum=other_weights,
        has_baseline_for_template=has_baseline,
    )
    return ValidateObjectiveResponse(valid=result.valid, errors=result.errors)
