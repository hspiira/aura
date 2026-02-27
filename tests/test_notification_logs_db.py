"""DB-backed tests for notification log repository and API."""

import pytest

from app.infrastructure.persistence.models.notification_log import (
    NotificationLog,
)
from app.infrastructure.persistence.repositories.notification_log_repo import (
    MAX_LIMIT,
    NotificationLogRepository,
)

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_notification_log_add_and_list(db_session) -> None:
    """Append a log entry and list (newest first)."""
    repo = NotificationLogRepository(db_session)
    entry = NotificationLog(
        event_type="objective_locked",
        recipient_id="user-123",
        channel="in_app",
        status="sent",
    )
    entry = await repo.add(entry)

    listed = await repo.list_all(limit=10)
    assert len(listed) >= 1
    found = next((e for e in listed if e.id == entry.id), None)
    assert found is not None
    assert found.event_type == "objective_locked"
    assert found.recipient_id == "user-123"
    assert found.status == "sent"


@pytest.mark.asyncio
async def test_notification_log_list_by_event_type(db_session) -> None:
    """list_by_event_type returns only entries for that event."""
    repo = NotificationLogRepository(db_session)
    e1 = NotificationLog(
        event_type="calibration_scheduled",
        recipient_id="user-1",
        channel="email",
        status="sent",
    )
    e2 = NotificationLog(
        event_type="quarterly_update_due",
        recipient_id="user-2",
        channel="in_app",
        status="sent",
    )
    await repo.add(e1)
    await repo.add(e2)

    listed = await repo.list_by_event_type("calibration_scheduled", limit=10)
    assert len(listed) == 1
    assert listed[0].id == e1.id
    assert listed[0].event_type == "calibration_scheduled"


@pytest.mark.asyncio
async def test_notification_log_list_all_clamps_limit(db_session) -> None:
    """list_all clamps limit to [1, MAX_LIMIT]; limit=0 behaves as 1."""
    repo = NotificationLogRepository(db_session)
    entry = NotificationLog(
        event_type="limit_test",
        recipient_id="u",
        channel="in_app",
        status="sent",
    )
    await repo.add(entry)

    listed_zero = await repo.list_all(limit=0)
    assert len(listed_zero) == 1
    assert listed_zero[0].id == entry.id

    listed_over_cap = await repo.list_all(limit=MAX_LIMIT + 5000)
    assert len(listed_over_cap) >= 1
    assert len(listed_over_cap) <= MAX_LIMIT


@pytest.mark.asyncio
async def test_notification_log_list_by_event_type_clamps_limit(db_session) -> None:
    """list_by_event_type clamps limit to [1, MAX_LIMIT]; limit=0 behaves as 1."""
    repo = NotificationLogRepository(db_session)
    entry = NotificationLog(
        event_type="clamp_test",
        recipient_id="u",
        channel="in_app",
        status="sent",
    )
    await repo.add(entry)

    listed_zero = await repo.list_by_event_type("clamp_test", limit=0)
    assert len(listed_zero) == 1
    assert listed_zero[0].id == entry.id


@pytest.mark.asyncio
async def test_notification_log_list_via_api(
    db_session, override_db_dependency
) -> None:
    """GET /notification-logs returns log entries (read-only)."""
    from app.infrastructure.persistence.database import get_db_transactional
    from app.main import app

    repo = NotificationLogRepository(db_session)
    entry = NotificationLog(
        event_type="review_completed",
        recipient_id="user-99",
        channel="email",
        status="sent",
    )
    await repo.add(entry)

    app.dependency_overrides[get_db_transactional] = override_db_dependency
    try:
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/v1/notification-logs",
                params={"limit": 10},
            )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        ids = [x["id"] for x in data]
        assert entry.id in ids
    finally:
        app.dependency_overrides.pop(get_db_transactional, None)
