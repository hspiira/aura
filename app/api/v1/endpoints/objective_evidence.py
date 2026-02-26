"""Objective evidence endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_objective_evidence_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.objective_evidence import (
    ObjectiveEvidence,
)
from app.infrastructure.persistence.repositories.objective_evidence_repo import (
    ObjectiveEvidenceRepository,
)
from app.schemas.objective_evidence import (
    ObjectiveEvidenceCreate,
    ObjectiveEvidenceResponse,
)

router = APIRouter()


@router.get("", response_model=list[ObjectiveEvidenceResponse])
async def list_evidence_for_objective(
    objective_id: str,
    repo: Annotated[ObjectiveEvidenceRepository, Depends(get_objective_evidence_repo)],
) -> list[ObjectiveEvidenceResponse]:
    """List evidence for an objective."""
    evidence = await repo.list_by_objective(objective_id)
    return [ObjectiveEvidenceResponse.model_validate(e) for e in evidence]


@router.post("", response_model=ObjectiveEvidenceResponse, status_code=201)
async def create_objective_evidence(
    payload: ObjectiveEvidenceCreate,
    repo: Annotated[ObjectiveEvidenceRepository, Depends(get_objective_evidence_repo)],
) -> ObjectiveEvidenceResponse:
    """Create evidence for an objective."""
    evidence = ObjectiveEvidence(
        objective_id=payload.objective_id,
        description=payload.description,
        file_path=payload.file_path,
        uploaded_by=payload.uploaded_by,
    )
    evidence = await repo.add(evidence)
    return ObjectiveEvidenceResponse.model_validate(evidence)


@router.get("/{id}", response_model=ObjectiveEvidenceResponse)
async def get_objective_evidence(
    id: str,
    repo: Annotated[ObjectiveEvidenceRepository, Depends(get_objective_evidence_repo)],
) -> ObjectiveEvidenceResponse:
    """Get one objective evidence by id."""
    evidence = await repo.get_by_id(id)
    if evidence is None:
        raise ResourceNotFoundException("ObjectiveEvidence", id)
    return ObjectiveEvidenceResponse.model_validate(evidence)
