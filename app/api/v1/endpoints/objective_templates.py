"""Objective template endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_objective_template_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.schemas.objective_template import (
    ObjectiveTemplateCreate,
    ObjectiveTemplateResponse,
)

router = APIRouter()


@router.get("", response_model=list[ObjectiveTemplateResponse])
async def list_objective_templates(
    repo: Annotated[ObjectiveTemplateRepository, Depends(get_objective_template_repo)],
) -> list[ObjectiveTemplateResponse]:
    """List all objective templates."""
    templates = await repo.list_all()
    return [ObjectiveTemplateResponse.model_validate(t) for t in templates]


@router.post("", response_model=ObjectiveTemplateResponse, status_code=201)
async def create_objective_template(
    payload: ObjectiveTemplateCreate,
    repo: Annotated[ObjectiveTemplateRepository, Depends(get_objective_template_repo)],
) -> ObjectiveTemplateResponse:
    """Create an objective template."""
    template = ObjectiveTemplate(
        code=payload.code,
        title=payload.title,
        description=payload.description,
        dimension_id=payload.dimension_id,
        kpi_type=payload.kpi_type,
        default_weight=payload.default_weight,
        min_target=payload.min_target,
        max_target=payload.max_target,
        requires_baseline_snapshot=payload.requires_baseline_snapshot,
        is_active=payload.is_active,
    )
    template = await repo.add(template)
    return ObjectiveTemplateResponse.model_validate(template)


@router.get("/{id}", response_model=ObjectiveTemplateResponse)
async def get_objective_template(
    id: str,
    repo: Annotated[ObjectiveTemplateRepository, Depends(get_objective_template_repo)],
) -> ObjectiveTemplateResponse:
    """Get one objective template by id."""
    template = await repo.get_by_id(id)
    if template is None:
        raise ResourceNotFoundException("ObjectiveTemplate", id)
    return ObjectiveTemplateResponse.model_validate(template)
