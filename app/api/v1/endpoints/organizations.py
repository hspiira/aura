"""Organization endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_organization_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.organization import Organization
from app.infrastructure.persistence.repositories.organization_repo import (
    OrganizationRepository,
)
from app.schemas.organization import OrganizationCreate, OrganizationResponse

router = APIRouter()


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    repo: Annotated[OrganizationRepository, Depends(get_organization_repo)],
) -> list[OrganizationResponse]:
    """List all organizations."""
    orgs = await repo.list_all()
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    payload: OrganizationCreate,
    repo: Annotated[OrganizationRepository, Depends(get_organization_repo)],
) -> OrganizationResponse:
    """Create an organization."""
    org = Organization(name=payload.name)
    org = await repo.add(org)
    return OrganizationResponse.model_validate(org)


@router.get("/{id}", response_model=OrganizationResponse)
async def get_organization(
    id: str,
    repo: Annotated[OrganizationRepository, Depends(get_organization_repo)],
) -> OrganizationResponse:
    """Get one organization by id."""
    org = await repo.get_by_id(id)
    if org is None:
        raise ResourceNotFoundException("Organization", id)
    return OrganizationResponse.model_validate(org)
