"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    departments,
    health,
    organizations,
    performance_cycles,
    performance_dimensions,
    role_dimension_weights,
    roles,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(
    organizations.router, prefix="/organizations", tags=["organizations"]
)
api_router.include_router(
    departments.router, prefix="/departments", tags=["departments"]
)
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    performance_cycles.router,
    prefix="/performance-cycles",
    tags=["performance-cycles"],
)
api_router.include_router(
    performance_dimensions.router,
    prefix="/performance-dimensions",
    tags=["performance-dimensions"],
)
api_router.include_router(
    role_dimension_weights.router,
    prefix="/role-dimension-weights",
    tags=["role-dimension-weights"],
)
