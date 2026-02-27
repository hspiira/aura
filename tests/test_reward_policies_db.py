"""DB-backed tests for reward policy repository and API."""

from decimal import Decimal

import pytest

from app.infrastructure.persistence.models.reward_policy import RewardPolicy
from app.infrastructure.persistence.repositories.reward_policy_repo import (
    RewardPolicyRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_reward_policy_add_and_get_by_id(db_session) -> None:
    """Add a reward policy and retrieve it by id."""
    repo = RewardPolicyRepository(db_session)
    policy = RewardPolicy(
        min_score=Decimal("0"),
        max_score=Decimal("59.99"),
        reward_type="pip",
        reward_value="Performance improvement plan",
    )
    policy = await repo.add(policy)

    found = await repo.get_by_id(policy.id)
    assert found is not None
    assert found.id == policy.id
    assert found.min_score == Decimal("0")
    assert found.max_score == Decimal("59.99")
    assert found.reward_type == "pip"
    assert found.reward_value == "Performance improvement plan"


@pytest.mark.asyncio
async def test_reward_policy_list_all(db_session) -> None:
    """list_all returns policies ordered by min_score."""
    repo = RewardPolicyRepository(db_session)
    p1 = RewardPolicy(
        min_score=Decimal("85"),
        max_score=Decimal("100"),
        reward_type="bonus",
        reward_value="10%",
    )
    p2 = RewardPolicy(
        min_score=Decimal("0"),
        max_score=Decimal("59.99"),
        reward_type="pip",
        reward_value="PIP",
    )
    await repo.add(p1)
    await repo.add(p2)

    listed = await repo.list_all()
    assert len(listed) == 2
    assert listed[0].min_score <= listed[1].min_score
    assert listed[0].min_score == Decimal("0")
    assert listed[1].min_score == Decimal("85")


@pytest.mark.asyncio
async def test_reward_policy_find_band_for_score(db_session) -> None:
    """find_band_for_score returns the policy band containing the score."""
    repo = RewardPolicyRepository(db_session)
    low = RewardPolicy(
        min_score=Decimal("0"),
        max_score=Decimal("59.99"),
        reward_type="pip",
        reward_value="PIP",
    )
    mid = RewardPolicy(
        min_score=Decimal("60"),
        max_score=Decimal("84.99"),
        reward_type="merit",
        reward_value="3%",
    )
    high = RewardPolicy(
        min_score=Decimal("85"),
        max_score=Decimal("100"),
        reward_type="bonus",
        reward_value="10%",
    )
    await repo.add(low)
    await repo.add(mid)
    await repo.add(high)

    band_50 = await repo.find_band_for_score(Decimal("50"))
    assert band_50 is not None
    assert band_50.reward_type == "pip"

    band_72 = await repo.find_band_for_score(Decimal("72.5"))
    assert band_72 is not None
    assert band_72.reward_type == "merit"

    band_90 = await repo.find_band_for_score(Decimal("90"))
    assert band_90 is not None
    assert band_90.reward_type == "bonus"

    band_boundary = await repo.find_band_for_score(Decimal("85"))
    assert band_boundary is not None
    assert band_boundary.reward_type == "bonus"

    band_none = await repo.find_band_for_score(Decimal("100.01"))
    assert band_none is None


@pytest.mark.asyncio
async def test_reward_policy_create_via_api(db_session, override_db_dependency) -> None:
    """POST /reward-policies creates a policy and returns 201."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/v1/reward-policies",
                json={
                    "min_score": "70",
                    "max_score": "84.99",
                    "reward_type": "merit",
                    "reward_value": "5%",
                },
            )
        assert response.status_code == 201
        data = response.json()
        assert data["min_score"] == 70
        assert data["max_score"] == 84.99
        assert data["reward_type"] == "merit"
        assert data["reward_value"] == "5%"
        assert "id" in data
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)


@pytest.mark.asyncio
async def test_reward_policy_band_endpoint_returns_matching_band(
    db_session, override_db_dependency
) -> None:
    """GET /reward-policies/band?score=75 returns the policy band containing 75."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    repo = RewardPolicyRepository(db_session)
    policy = RewardPolicy(
        min_score=Decimal("60"),
        max_score=Decimal("84.99"),
        reward_type="merit",
        reward_value="5%",
    )
    policy = await repo.add(policy)

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/v1/reward-policies/band",
                params={"score": "75"},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == policy.id
        assert data["reward_type"] == "merit"
        assert data["reward_value"] == "5%"
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)


@pytest.mark.asyncio
async def test_reward_policy_band_endpoint_returns_404_when_no_band(
    db_session, override_db_dependency
) -> None:
    """GET /reward-policies/band?score=... returns 404 when no band contains score."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/v1/reward-policies/band",
                params={"score": "150"},
            )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
