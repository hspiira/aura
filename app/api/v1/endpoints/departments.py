"""Department endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_department_repo
from app.domain.exceptions import ResourceNotFoundException
from app.infrastructure.persistence.models.department import Department
from app.infrastructure.persistence.repositories.department_repo import (
    DepartmentRepository,
)
from app.schemas.department import DepartmentCreate, DepartmentResponse

router = APIRouter()


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(
    repo: Annotated[DepartmentRepository, Depends(get_department_repo)],
) -> list[DepartmentResponse]:
    """List all departments."""
    depts = await repo.list_all()
    return [DepartmentResponse.model_validate(d) for d in depts]


@router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(
    payload: DepartmentCreate,
    repo: Annotated[DepartmentRepository, Depends(get_department_repo)],
) -> DepartmentResponse:
    """Create a department."""
    dept = Department(
        organization_id=payload.organization_id,
        parent_id=payload.parent_id,
        name=payload.name,
    )
    dept = await repo.add(dept)
    return DepartmentResponse.model_validate(dept)


@router.get("/{id}", response_model=DepartmentResponse)
async def get_department(
    id: str,
    repo: Annotated[DepartmentRepository, Depends(get_department_repo)],
) -> DepartmentResponse:
    """Get one department by id."""
    dept = await repo.get_by_id(id)
    if dept is None:
        raise ResourceNotFoundException("Department", id)
    return DepartmentResponse.model_validate(dept)
