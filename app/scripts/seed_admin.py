"""Seed an Admin user with all permissions and a login token.

Run from repo root with DATABASE_URL set:

    uv run python -m app.scripts.seed_admin

Prints the one-time login token; use it on /login to sign in as Admin.
If the Admin user already exists (email admin@example.com), only a new token is issued.

The default admin is also ensured on app startup (lifespan): name "Admin",
email admin@example.com, password adminpass. Log in via POST /api/v1/auth/login.
"""

import asyncio
import secrets
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth_service import hash_password
from app.domain import permissions as perm_module
from app.infrastructure.persistence import database as db_module
from app.infrastructure.persistence.models.department import Department
from app.infrastructure.persistence.models.organization import Organization
from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.models.role import Role
from app.infrastructure.persistence.models.role_permission import RolePermission
from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.models.user_token import UserToken
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)
from app.infrastructure.persistence.repositories.user_token_repo import (
    UserTokenRepository,
)

ADMIN_EMAIL = "admin@aura.com"
ADMIN_PASSWORD = "adminpass"


def _all_permission_codes() -> list[str]:
    """Return all permission code constants from domain.permissions."""
    return [
        getattr(perm_module, k)
        for k in dir(perm_module)
        if k.isupper() and isinstance(getattr(perm_module, k), str)
    ]


async def _ensure_permissions(
    perm_repo: PermissionRepository,
) -> dict[str, Permission]:
    """Ensure all domain permissions exist; return code -> Permission."""
    codes = _all_permission_codes()
    permission_by_code: dict[str, Permission] = {}
    for code in codes:
        existing = await perm_repo.get_by_code(code)
        if existing is not None:
            permission_by_code[code] = existing
        else:
            name = code.replace("_", " ").title()
            p = Permission(code=code, name=name, description=None)
            p = await perm_repo.add(p)
            permission_by_code[code] = p
    return permission_by_code


async def _find_admin_user(session: AsyncSession) -> User | None:
    """Return the Admin user by email if it exists."""
    result = await session.execute(
        select(User).where(User.email == ADMIN_EMAIL).limit(1)
    )
    return result.scalar_one_or_none()


async def ensure_admin_user() -> None:
    """Idempotent: ensure an Admin user with all permissions exists (e.g. on DB init).

    Creates org/dept/role/user with email admin@example.com and password adminpass
    if missing. If the user exists but has no password, sets password to adminpass.
    """
    if db_module.AsyncSessionLocal is None:
        return
    async with db_module.AsyncSessionLocal() as session:
        async with session.begin():
            perm_repo = PermissionRepository(session)
            permission_by_code = await _ensure_permissions(perm_repo)
            existing_admin = await _find_admin_user(session)

            if existing_admin is not None:
                if existing_admin.password_hash is None:
                    existing_admin.password_hash = hash_password(ADMIN_PASSWORD)
                return

            org = Organization(name="Aura")
            session.add(org)
            await session.flush()
            await session.refresh(org)

            dept = Department(
                organization_id=org.id,
                parent_id=None,
                name="Admin",
            )
            session.add(dept)
            await session.flush()
            await session.refresh(dept)

            role = Role(
                department_id=dept.id,
                name="Admin",
                level=None,
                is_managerial=True,
            )
            session.add(role)
            await session.flush()
            await session.refresh(role)

            for perm in permission_by_code.values():
                rp = RolePermission(role_id=role.id, permission_id=perm.id)
                session.add(rp)
            await session.flush()

            user = User(
                role_id=role.id,
                department_id=dept.id,
                supervisor_id=None,
                name="Admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
            )
            session.add(user)


async def seed_admin() -> None:
    """Create org, dept, Admin role (all perms), Admin user, and one token."""
    db_module._ensure_engine()
    if db_module.AsyncSessionLocal is None:
        print("DATABASE_URL not set. Set it in .env or environment.", file=sys.stderr)
        sys.exit(1)

    async with db_module.AsyncSessionLocal() as session:
        async with session.begin():
            perm_repo = PermissionRepository(session)
            token_repo = UserTokenRepository(session)

            permission_by_code = await _ensure_permissions(perm_repo)
            existing_admin = await _find_admin_user(session)

            if existing_admin is not None:
                user = existing_admin
            else:
                org = Organization(name="Aura")
                session.add(org)
                await session.flush()
                await session.refresh(org)

                dept = Department(
                    organization_id=org.id,
                    parent_id=None,
                    name="Admin",
                )
                session.add(dept)
                await session.flush()
                await session.refresh(dept)

                role = Role(
                    department_id=dept.id,
                    name="Admin",
                    level=None,
                    is_managerial=True,
                )
                session.add(role)
                await session.flush()
                await session.refresh(role)

                for perm in permission_by_code.values():
                    rp = RolePermission(role_id=role.id, permission_id=perm.id)
                    session.add(rp)
                await session.flush()

                user = User(
                    role_id=role.id,
                    department_id=dept.id,
                    supervisor_id=None,
                    name="Admin",
                    email=ADMIN_EMAIL,
                    password_hash=hash_password(ADMIN_PASSWORD),
                )
                session.add(user)
                await session.flush()
                await session.refresh(user)

            raw_token = secrets.token_urlsafe(32)
            token_hash = UserTokenRepository.hash_token(raw_token)
            user_token = UserToken(
                user_id=user.id,
                token_hash=token_hash,
                description="Seed admin token",
                expires_at=None,
                revoked=False,
            )
            await token_repo.add(user_token)

    print("Admin user and token created successfully.")
    print()
    print("Login token (use once on /login; store securely):")
    print()
    print(raw_token)
    print()
    print("Then open your app at /login and paste this token to sign in as Admin.")


def main() -> None:
    asyncio.run(seed_admin())


if __name__ == "__main__":
    main()
