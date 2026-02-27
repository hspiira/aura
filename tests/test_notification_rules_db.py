"""DB-backed tests for notification rule repository and API."""

import pytest

from app.infrastructure.persistence.models.notification_rule import (
    NotificationRule,
)
from app.infrastructure.persistence.repositories.notification_rule_repo import (
    NotificationRuleRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_notification_rule_add_and_get_by_id(
    db_session, seed_phase1
) -> None:
    """Add a notification rule and retrieve it by id."""
    repo = NotificationRuleRepository(db_session)
    rule = NotificationRule(
        event_type="objective_locked",
        recipient_role_id=seed_phase1["role_id"],
        channel="in_app",
        template_body="Objective {{objective_id}} has been locked.",
    )
    rule = await repo.add(rule)

    found = await repo.get_by_id(rule.id)
    assert found is not None
    assert found.id == rule.id
    assert found.event_type == "objective_locked"
    assert found.channel == "in_app"


@pytest.mark.asyncio
async def test_notification_rule_list_by_event_type(
    db_session, seed_phase1
) -> None:
    """list_by_event_type returns only rules for that event."""
    repo = NotificationRuleRepository(db_session)
    r1 = NotificationRule(
        event_type="calibration_scheduled",
        recipient_role_id=seed_phase1["role_id"],
        channel="email",
    )
    r2 = NotificationRule(
        event_type="calibration_scheduled",
        recipient_role_id=seed_phase1["role_id"],
        channel="in_app",
    )
    await repo.add(r1)
    await repo.add(r2)

    listed = await repo.list_by_event_type("calibration_scheduled")
    assert len(listed) == 2
    assert {x.id for x in listed} == {r1.id, r2.id}


@pytest.mark.asyncio
async def test_notification_rule_create_via_api(
    db_session, seed_phase1, override_db_dependency
) -> None:
    """POST /notification-rules creates a rule and returns 201."""
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
                "/api/v1/notification-rules",
                json={
                    "event_type": "review_completed",
                    "recipient_role_id": seed_phase1["role_id"],
                    "channel": "email",
                    "template_body": "Review completed for {{user_id}}",
                },
            )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "review_completed"
        assert data["recipient_role_id"] == seed_phase1["role_id"]
        assert data["channel"] == "email"
        assert "id" in data
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
