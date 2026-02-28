"""Objective template endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import (
    get_audit_log_repo,
    get_objective_template_repo,
    require_permission,
)
from app.core.audit import audit_log
from app.core.auth import CurrentUserIdOptional
from app.domain.exceptions import ResourceNotFoundException
from app.domain.permissions import MANAGE_TEMPLATES
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.repositories.audit_log_repo import (
    AuditLogRepository,
)
from app.infrastructure.persistence.repositories.objective_template_repo import (
    ObjectiveTemplateRepository,
)
from app.schemas.objective_template import (
    ObjectiveTemplateCreate,
    ObjectiveTemplateResponse,
    ObjectiveTemplateUpdate,
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
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    _perm: Annotated[None, Depends(require_permission(MANAGE_TEMPLATES))],
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
    await audit_log(
        audit_repo,
        "objective_template",
        template.id,
        "create",
        new_value={"code": template.code},
        changed_by=changed_by,
    )
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


@router.patch("/{id}", response_model=ObjectiveTemplateResponse)
async def update_objective_template(
    id: str,
    payload: ObjectiveTemplateUpdate,
    repo: Annotated[ObjectiveTemplateRepository, Depends(get_objective_template_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    _perm: Annotated[None, Depends(require_permission(MANAGE_TEMPLATES))],
) -> ObjectiveTemplateResponse:
    """Update an objective template, creating a new version when safe.

    Returns 409 if template is in use in a started cycle.
    """
    template = await repo.get_by_id(id)
    if template is None:
        raise ResourceNotFoundException("ObjectiveTemplate", id)
    if await repo.has_any_objective_in_started_cycle(id):
        raise HTTPException(
            status_code=409,
            detail="Template is in use in a started cycle and cannot be modified.",
        )
    update_data = payload.model_dump(exclude_unset=True, mode="json")
    if not update_data:
        return ObjectiveTemplateResponse.model_validate(template)

    new_template = await repo.create_new_version(template, update_data)
    await audit_log(
        audit_repo,
        "objective_template",
        new_template.id,
        "update",
        new_value={
            "code": new_template.code,
            **update_data,
            "version": new_template.version,
        },
        changed_by=changed_by,
    )
    return ObjectiveTemplateResponse.model_validate(new_template)


@router.delete("/{id}", status_code=204)
async def delete_objective_template(
    id: str,
    repo: Annotated[ObjectiveTemplateRepository, Depends(get_objective_template_repo)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repo)],
    changed_by: CurrentUserIdOptional,
    _perm: Annotated[None, Depends(require_permission(MANAGE_TEMPLATES))],
) -> None:
    """Soft-deactivate an objective template.

    Returns 409 if in use in a started cycle.
    """
    template = await repo.get_by_id(id)
    if template is None:
        raise ResourceNotFoundException("ObjectiveTemplate", id)
    if await repo.has_any_objective_in_started_cycle(id):
        raise HTTPException(
            status_code=409,
            detail="Template is in use in a started cycle and cannot be deactivated.",
        )
    template = await repo.update(template, is_active=False)
    await audit_log(
        audit_repo,
        "objective_template",
        template.id,
        "deactivate",
        new_value={"code": template.code},
        changed_by=changed_by,
    )
