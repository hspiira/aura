"""Seed ~20 records per table with CUID2 IDs for development/testing.

Run from repo root with DATABASE_URL set:

    uv run python -m app.scripts.seed_data

Creates data in dependency order. IDs are generated via app.shared.utils.generate_cuid.
Does not replace seed_admin; run seed_admin first if you need an Admin user and token.
"""

import asyncio
import hashlib
import random
import secrets
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain import permissions as perm_module
from app.domain.review_session import ReviewSessionStatus, ReviewSessionType
from app.infrastructure.persistence import database as db_module
from app.infrastructure.persistence.models.audit_log import AuditLog
from app.infrastructure.persistence.models.baseline_snapshot import BaselineSnapshot
from app.infrastructure.persistence.models.behavioral_indicator import (
    BehavioralIndicator,
)
from app.infrastructure.persistence.models.behavioral_score import BehavioralScore
from app.infrastructure.persistence.models.calibration_session import (
    CalibrationSession,
)
from app.infrastructure.persistence.models.department import Department
from app.infrastructure.persistence.models.dim_cycle import DimCycle
from app.infrastructure.persistence.models.dim_time import DimTime
from app.infrastructure.persistence.models.fact_performance_summary import (
    FactPerformanceSummary,
)
from app.infrastructure.persistence.models.notification_log import NotificationLog
from app.infrastructure.persistence.models.notification_outbox import (
    NotificationOutbox,
)
from app.infrastructure.persistence.models.notification_rule import (
    NotificationRule,
)
from app.infrastructure.persistence.models.objective import Objective
from app.infrastructure.persistence.models.objective_evidence import (
    ObjectiveEvidence,
)
from app.infrastructure.persistence.models.objective_flag import ObjectiveFlag
from app.infrastructure.persistence.models.objective_score import ObjectiveScore
from app.infrastructure.persistence.models.objective_template import (
    ObjectiveTemplate,
)
from app.infrastructure.persistence.models.objective_update import (
    ObjectiveUpdate,
)
from app.infrastructure.persistence.models.objective_version import (
    ObjectiveVersion,
)
from app.infrastructure.persistence.models.organization import Organization
from app.infrastructure.persistence.models.performance_cycle import (
    PerformanceCycle,
)
from app.infrastructure.persistence.models.performance_dimension import (
    PerformanceDimension,
)
from app.infrastructure.persistence.models.performance_summary import (
    PerformanceSummary,
)
from app.infrastructure.persistence.models.permission import Permission
from app.infrastructure.persistence.models.review_session import ReviewSession
from app.infrastructure.persistence.models.reward_policy import RewardPolicy
from app.infrastructure.persistence.models.role import Role
from app.infrastructure.persistence.models.role_dimension_weight import (
    RoleDimensionWeight,
)
from app.infrastructure.persistence.models.role_permission import RolePermission
from app.infrastructure.persistence.models.user import User
from app.infrastructure.persistence.models.user_token import UserToken
from app.infrastructure.persistence.repositories.permission_repo import (
    PermissionRepository,
)

SEED_COUNT = 20


def _all_permission_codes() -> list[str]:
    """Return all permission code constants from domain.permissions."""
    return [
        getattr(perm_module, k)
        for k in dir(perm_module)
        if k.isupper() and isinstance(getattr(perm_module, k), str)
    ]


def _hash_token(raw: str) -> str:
    """Hash token for UserToken.token_hash (matches UserTokenRepository)."""
    return hashlib.sha256(raw.encode()).hexdigest()


async def _ensure_permissions(
    session: AsyncSession,
) -> list[Permission]:
    """Ensure all domain permissions exist; return list of Permission."""
    perm_repo = PermissionRepository(session)
    codes = _all_permission_codes()
    result: list[Permission] = []
    for code in codes:
        existing = await perm_repo.get_by_code(code)
        if existing is not None:
            result.append(existing)
        else:
            name = code.replace("_", " ").title()
            p = Permission(code=code, name=name, description=None)
            p = await perm_repo.add(p)
            result.append(p)
    return result


async def seed_data() -> None:
    """Create ~SEED_COUNT records per table in dependency order."""
    db_module._ensure_engine()
    if db_module.AsyncSessionLocal is None:
        print("DATABASE_URL not set. Set it in .env or environment.", file=sys.stderr)
        sys.exit(1)

    async with db_module.AsyncSessionLocal() as session:
        async with session.begin():
            # Permissions (ensure domain set exists; we use them for role_permissions)
            perms = await _ensure_permissions(session)
            perm_ids = [p.id for p in perms]

            # 1. Organizations
            orgs: list[Organization] = []
            for i in range(SEED_COUNT):
                o = Organization(name=f"Seed Org {i + 1}")
                session.add(o)
                orgs.append(o)
            await session.flush()
            for o in orgs:
                await session.refresh(o)
            org_ids = [o.id for o in orgs]

            # 2. Performance dimensions
            dim_names = [
                "Financial",
                "Operational",
                "Behavioral",
                "Customer",
                "Innovation",
                "Quality",
                "Growth",
                "Efficiency",
                "Compliance",
                "Safety",
                "Sustainability",
                "Collaboration",
                "Leadership",
                "Delivery",
                "Revenue",
                "Cost",
                "Engagement",
                "Retention",
                "Satisfaction",
                "Excellence",
            ]
            dims: list[PerformanceDimension] = []
            for i in range(SEED_COUNT):
                d = PerformanceDimension(
                    name=dim_names[i % len(dim_names)]
                    + (f" {i}" if i >= len(dim_names) else ""),
                    is_quantitative=random.choice([True, False]),
                    default_weight_pct=Decimal(str(round(random.uniform(0, 25), 2))),
                )
                session.add(d)
                dims.append(d)
            await session.flush()
            for d in dims:
                await session.refresh(d)
            dim_ids = [d.id for d in dims]

            # 3. Performance cycles
            cycles: list[PerformanceCycle] = []
            base_year = 2023
            for i in range(SEED_COUNT):
                y = base_year + (i // 2)
                start = date(y, 1, 1) + timedelta(days=i * 30)
                end = start + timedelta(days=364)
                c = PerformanceCycle(
                    name=f"Cycle {y} H{i % 2 + 1}",
                    start_date=start,
                    end_date=end,
                    status=random.choice(["draft", "active", "closed"]),
                    review_frequency=random.choice(["quarterly", "annual", None]),
                )
                session.add(c)
                cycles.append(c)
            await session.flush()
            for c in cycles:
                await session.refresh(c)
            cycle_ids = [c.id for c in cycles]

            # 4. Departments (spread across orgs)
            depts: list[Department] = []
            for i in range(SEED_COUNT):
                parent = depts[i - 1] if i > 0 else None
                dept = Department(
                    organization_id=org_ids[i % len(org_ids)],
                    parent_id=parent.id if parent else None,
                    name=f"Dept Seed {i + 1}",
                )
                session.add(dept)
                depts.append(dept)
            await session.flush()
            for dept in depts:
                await session.refresh(dept)
            dept_ids = [dept.id for dept in depts]

            # 5. Roles (one per dept for simplicity)
            roles: list[Role] = []
            for i in range(SEED_COUNT):
                r = Role(
                    department_id=dept_ids[i],
                    name=f"Role Seed {i + 1}",
                    level=random.choice(["L1", "L2", "L3", "Senior", None]),
                    is_managerial=random.choice([True, False]),
                )
                session.add(r)
                roles.append(r)
            await session.flush()
            for r in roles:
                await session.refresh(r)
            role_ids = [r.id for r in roles]

            # 6. RolePermission (unique role_id, permission_id)
            seen_rp: set[tuple[str, str]] = set()
            for _ in range(SEED_COUNT):
                rid = random.choice(role_ids)
                pid = random.choice(perm_ids)
                if (rid, pid) in seen_rp:
                    continue
                seen_rp.add((rid, pid))
                session.add(RolePermission(role_id=rid, permission_id=pid))
            await session.flush()

            # 7. Users (role, dept; optional supervisor)
            users: list[User] = []
            for i in range(SEED_COUNT):
                supervisor = (
                    users[i - 1] if i > 0 and random.choice([True, False]) else None
                )
                u = User(
                    role_id=role_ids[i],
                    department_id=dept_ids[i],
                    supervisor_id=supervisor.id if supervisor else None,
                    name=f"Seed User {i + 1}",
                    email=f"seed.user.{i + 1}@example.com",
                )
                session.add(u)
                users.append(u)
            await session.flush()
            for u in users:
                await session.refresh(u)
            user_ids = [u.id for u in users]

            # 8. UserTokens (unique token_hash)
            for i in range(SEED_COUNT):
                raw = secrets.token_urlsafe(32)
                session.add(
                    UserToken(
                        user_id=user_ids[i],
                        token_hash=_hash_token(raw),
                        description=f"Seed token {i + 1}",
                        expires_at=None,
                        revoked=False,
                    )
                )
            await session.flush()

            # 9. RoleDimensionWeight (unique role_id, dimension_id)
            seen_rdw: set[tuple[str, str]] = set()
            for _ in range(SEED_COUNT):
                rid = random.choice(role_ids)
                did = random.choice(dim_ids)
                if (rid, did) in seen_rdw:
                    continue
                seen_rdw.add((rid, did))
                session.add(
                    RoleDimensionWeight(
                        role_id=rid,
                        dimension_id=did,
                        weight_pct=Decimal(str(round(random.uniform(1, 30), 2))),
                    )
                )
            await session.flush()

            # 10. ObjectiveTemplates (unique code, dimension_id)
            templates: list[ObjectiveTemplate] = []
            for i in range(SEED_COUNT):
                t = ObjectiveTemplate(
                    code=f"SEED_TMPL_{i + 1:03d}",
                    version=1,
                    title=f"Seed template {i + 1}",
                    description=(
                        f"Description for template {i + 1}" if i % 2 == 0 else None
                    ),
                    dimension_id=dim_ids[i % len(dim_ids)],
                    kpi_type=random.choice(["number", "currency", "percent", None]),
                    default_weight=Decimal(str(round(random.uniform(5, 20), 2))),
                    min_target=(
                        Decimal(str(round(random.uniform(0, 50), 2)))
                        if i % 3 == 0
                        else None
                    ),
                    max_target=(
                        Decimal(str(round(random.uniform(50, 100), 2)))
                        if i % 3 == 0
                        else None
                    ),
                    requires_baseline_snapshot=random.choice([True, False]),
                    is_active=True,
                    superseded_by_id=None,
                )
                session.add(t)
                templates.append(t)
            await session.flush()
            for t in templates:
                await session.refresh(t)
            template_ids = [t.id for t in templates]

            # 11. Objectives (user, cycle, dimension, optional template)
            statuses = [
                "draft",
                "submitted",
                "rejected",
                "approved",
                "active",
                "at_risk",
                "completed",
                "under_review",
                "closed",
            ]
            objectives: list[Objective] = []
            for i in range(SEED_COUNT):
                start = date(2024, 1, 1) + timedelta(days=i * 10)
                end = start + timedelta(days=180)
                ob = Objective(
                    user_id=user_ids[i],
                    performance_cycle_id=cycle_ids[i % len(cycle_ids)],
                    dimension_id=dim_ids[i % len(dim_ids)],
                    template_id=template_ids[i] if i < len(template_ids) else None,
                    title=f"Seed objective {i + 1}",
                    description=(
                        f"Objective description {i + 1}" if i % 2 == 0 else None
                    ),
                    kpi_type=random.choice(["number", "currency", "percent", None]),
                    target_value=(
                        Decimal(str(round(random.uniform(10, 100), 2)))
                        if i % 2 == 0
                        else None
                    ),
                    unit_of_measure=random.choice(["units", "%", "USD", None]),
                    weight=Decimal(str(round(random.uniform(5, 25), 2))),
                    start_date=start,
                    end_date=end,
                    status=random.choice(statuses),
                    approved_at=(
                        datetime.now().astimezone()
                        if random.choice([True, False])
                        else None
                    ),
                    approved_by=(
                        user_ids[(i + 1) % len(user_ids)]
                        if random.choice([True, False])
                        else None
                    ),
                    locked_at=None,
                    row_version=0,
                )
                session.add(ob)
                objectives.append(ob)
            await session.flush()
            for ob in objectives:
                await session.refresh(ob)
            objective_ids = [ob.id for ob in objectives]

            # 12. ObjectiveVersions
            for i in range(SEED_COUNT):
                ob = objectives[i]
                session.add(
                    ObjectiveVersion(
                        objective_id=ob.id,
                        version=1,
                        title=ob.title,
                        description=ob.description,
                        target_value=ob.target_value,
                        weight=ob.weight,
                        status=ob.status,
                        amended_at=datetime.now().astimezone(),
                        amended_by=user_ids[i % len(user_ids)],
                        justification=f"Seed amendment {i + 1}" if i % 2 == 0 else None,
                    )
                )
            await session.flush()

            # 13. ObjectiveUpdates
            for i in range(SEED_COUNT):
                session.add(
                    ObjectiveUpdate(
                        objective_id=objective_ids[i],
                        actual_value=(
                            Decimal(str(round(random.uniform(0, 100), 2)))
                            if i % 2 == 0
                            else None
                        ),
                        comment=f"Progress update {i + 1}" if i % 2 == 0 else None,
                        submitted_by=user_ids[i],
                    )
                )
            await session.flush()

            # 14. ObjectiveEvidence
            for i in range(SEED_COUNT):
                session.add(
                    ObjectiveEvidence(
                        objective_id=objective_ids[i],
                        description=f"Evidence {i + 1}",
                        file_path=f"/uploads/seed_{i + 1}.pdf" if i % 3 == 0 else None,
                        uploaded_by=user_ids[i],
                    )
                )
            await session.flush()

            # 15. ObjectiveFlags (unique objective_id, flag_type)
            flag_types = ["stale_update", "overdue", "needs_review", "escalated"]
            seen_flag: set[tuple[str, str]] = set()
            for _ in range(SEED_COUNT):
                oid = random.choice(objective_ids)
                ft = random.choice(flag_types)
                if (oid, ft) in seen_flag:
                    continue
                seen_flag.add((oid, ft))
                session.add(
                    ObjectiveFlag(
                        objective_id=oid,
                        flag_type=ft,
                        set_at=datetime.now().astimezone(),
                    )
                )
            await session.flush()

            # 16. ObjectiveScores (one per objective; objective_id unique)
            for i in range(SEED_COUNT):
                session.add(
                    ObjectiveScore(
                        objective_id=objective_ids[i],
                        achievement_percentage=Decimal(
                            str(round(random.uniform(0, 100), 2))
                        ),
                        weighted_score=Decimal(str(round(random.uniform(0, 25), 2))),
                        calculated_at=datetime.now().astimezone(),
                        locked=random.choice([True, False]),
                    )
                )
            await session.flush()

            # 17. BehavioralIndicators (dimension_id)
            indicators: list[BehavioralIndicator] = []
            for i in range(SEED_COUNT):
                bi = BehavioralIndicator(
                    dimension_id=dim_ids[i % len(dim_ids)],
                    name=f"Seed indicator {i + 1}",
                    description=f"Behavioral indicator {i + 1}" if i % 2 == 0 else None,
                    rating_scale_min=1,
                    rating_scale_max=5,
                    is_active=True,
                )
                session.add(bi)
                indicators.append(bi)
            await session.flush()
            for bi in indicators:
                await session.refresh(bi)
            indicator_ids = [bi.id for bi in indicators]

            # 18. BehavioralScores (unique user_id, performance_cycle_id, indicator_id)
            seen_bs: set[tuple[str, str, str]] = set()
            for _ in range(SEED_COUNT):
                uid = random.choice(user_ids)
                cid = random.choice(cycle_ids)
                iid = random.choice(indicator_ids)
                if (uid, cid, iid) in seen_bs:
                    continue
                seen_bs.add((uid, cid, iid))
                session.add(
                    BehavioralScore(
                        user_id=uid,
                        performance_cycle_id=cid,
                        indicator_id=iid,
                        rating=random.randint(1, 5),
                        manager_comment=(
                            "Seed comment" if random.choice([True, False]) else None
                        ),
                    )
                )
            await session.flush()

            # 19. CalibrationSessions
            for i in range(SEED_COUNT):
                session.add(
                    CalibrationSession(
                        performance_cycle_id=cycle_ids[i % len(cycle_ids)],
                        department_id=dept_ids[i % len(dept_ids)],
                        conducted_by_id=user_ids[i % len(user_ids)],
                        conducted_at=datetime.now().astimezone()
                        - timedelta(days=random.randint(0, 90)),
                        notes=f"Calibration notes {i + 1}" if i % 2 == 0 else None,
                    )
                )
            await session.flush()

            # 20. ReviewSessions (user, cycle, reviewer)
            for i in range(SEED_COUNT):
                uid = user_ids[i]
                cid = cycle_ids[i % len(cycle_ids)]
                reviewer_id = user_ids[(i + 1) % len(user_ids)]
                session.add(
                    ReviewSession(
                        user_id=uid,
                        performance_cycle_id=cid,
                        reviewer_id=reviewer_id,
                        session_type=random.choice(
                            [ReviewSessionType.MID_YEAR, ReviewSessionType.FINAL]
                        ),
                        status=random.choice(list(ReviewSessionStatus)),
                        scheduled_at=datetime.now().astimezone()
                        + timedelta(days=random.randint(1, 60)),
                        completed_at=(
                            datetime.now().astimezone()
                            - timedelta(days=random.randint(0, 30))
                            if random.choice([True, False])
                            else None
                        ),
                    )
                )
            await session.flush()

            # 21. PerformanceSummaries (unique user_id, performance_cycle_id)
            seen_ps: set[tuple[str, str]] = set()
            for _ in range(SEED_COUNT):
                uid = random.choice(user_ids)
                cid = random.choice(cycle_ids)
                if (uid, cid) in seen_ps:
                    continue
                seen_ps.add((uid, cid))
                session.add(
                    PerformanceSummary(
                        user_id=uid,
                        performance_cycle_id=cid,
                        quantitative_score=Decimal(
                            str(round(random.uniform(50, 100), 2))
                        ),
                        behavioral_score=Decimal(str(round(random.uniform(1, 5), 2))),
                        final_weighted_score=Decimal(
                            str(round(random.uniform(60, 95), 2))
                        ),
                        final_rating_band=random.choice(
                            ["Exceeds", "Meets", "Developing", "Below"]
                        ),
                        manager_comment=(
                            "Summary comment" if random.choice([True, False]) else None
                        ),
                        employee_comment=None,
                        hr_approved=random.choice([True, False]),
                    )
                )
            await session.flush()

            # 22. FactPerformanceSummary (string IDs; no FK to our tables)
            for i in range(SEED_COUNT):
                session.add(
                    FactPerformanceSummary(
                        user_id=f"fact_user_{i}",
                        department_id=dept_ids[i % len(dept_ids)],
                        role_id=role_ids[i % len(role_ids)],
                        performance_cycle_id=cycle_ids[i % len(cycle_ids)],
                        cycle_year=2023 + (i % 3),
                        quantitative_score=Decimal(
                            str(round(random.uniform(50, 100), 2))
                        ),
                        behavioral_score=Decimal(str(round(random.uniform(1, 5), 2))),
                        final_score=Decimal(str(round(random.uniform(60, 95), 2))),
                        rating_band=random.choice(
                            ["Exceeds", "Meets", "Developing", "Below"]
                        ),
                    )
                )
            await session.flush()

            # 23. RewardPolicies (min_score <= max_score)
            for i in range(SEED_COUNT):
                lo = round(random.uniform(0, 70), 2)
                hi = round(lo + random.uniform(10, 30), 2)
                session.add(
                    RewardPolicy(
                        min_score=Decimal(str(lo)),
                        max_score=Decimal(str(hi)),
                        reward_type=random.choice(
                            ["bonus", "raise", "stock", "recognition"]
                        ),
                        reward_value=str(round(random.uniform(1, 20), 2)) + "%",
                    )
                )
            await session.flush()

            # 24. NotificationRules (unique event_type, recipient_role_id, channel)
            event_types = [
                "objective_submitted",
                "review_scheduled",
                "calibration_complete",
            ]
            channels = ["email", "in_app", "slack"]
            seen_nr: set[tuple[str, str, str]] = set()
            for _ in range(SEED_COUNT):
                ev = random.choice(event_types)
                rid = random.choice(role_ids)
                ch = random.choice(channels)
                if (ev, rid, ch) in seen_nr:
                    continue
                seen_nr.add((ev, rid, ch))
                session.add(
                    NotificationRule(
                        event_type=ev,
                        recipient_role_id=rid,
                        channel=ch,
                        template_body=f"Hello, {{name}}. Event: {ev}",
                    )
                )
            await session.flush()

            # 25. NotificationLogs
            for i in range(SEED_COUNT):
                session.add(
                    NotificationLog(
                        event_type=random.choice(
                            ["objective_submitted", "review_reminder"]
                        ),
                        recipient_id=user_ids[i % len(user_ids)],
                        channel=random.choice(["email", "in_app"]),
                        status="sent",
                        error_message=None,
                    )
                )
            await session.flush()

            # 26. NotificationOutbox
            for i in range(SEED_COUNT):
                session.add(
                    NotificationOutbox(
                        event_type=f"seed_event_{i}",
                        context={"user_id": user_ids[i % len(user_ids)], "i": i},
                        status=random.choice(
                            ["pending", "processing", "delivered", "failed"]
                        ),
                        attempts=random.randint(0, 3),
                        last_error="Seed error" if i % 5 == 0 else None,
                        process_after=datetime.now().astimezone() + timedelta(hours=1),
                    )
                )
            await session.flush()

            # 27. AuditLogs
            for i in range(SEED_COUNT):
                session.add(
                    AuditLog(
                        entity_type=random.choice(
                            ["objective", "user", "review_session"]
                        ),
                        entity_id=(
                            objective_ids[i % len(objective_ids)]
                            if i % 3 == 0
                            else user_ids[i % len(user_ids)]
                        ),
                        action=random.choice(["create", "update", "approve", "delete"]),
                        old_value={"previous": i} if i % 2 == 0 else None,
                        new_value={"current": i + 1},
                        changed_by=user_ids[i % len(user_ids)],
                    )
                )
            await session.flush()

            # 28. BaselineSnapshots (unique user_id, performance_cycle_id, template_id)
            seen_baseline: set[tuple[str, str, str]] = set()
            for _ in range(SEED_COUNT):
                uid = random.choice(user_ids)
                cid = random.choice(cycle_ids)
                tid = random.choice(template_ids)
                if (uid, cid, tid) in seen_baseline:
                    continue
                seen_baseline.add((uid, cid, tid))
                session.add(
                    BaselineSnapshot(
                        user_id=uid,
                        performance_cycle_id=cid,
                        template_id=tid,
                        baseline_value=Decimal(str(round(random.uniform(0, 100), 2))),
                        snapshot_date=date(2024, 1, 1)
                        + timedelta(days=random.randint(0, 90)),
                        data_source="seed_import",
                    )
                )
            await session.flush()

            # 29. DimCycle (cycle_id unique)
            for i in range(SEED_COUNT):
                y = 2023 + (i % 3)
                start = date(y, 1, 1)
                end = date(y, 12, 31)
                session.add(
                    DimCycle(
                        cycle_id=f"dim_cycle_{i}_{y}",
                        name=f"Dim Cycle {y} {i}",
                        cycle_year=y,
                        start_date=start,
                        end_date=end,
                    )
                )
            await session.flush()

            # 30. DimTime (composite PK: year, quarter)
            seen_dt: set[tuple[int, int]] = set()
            for _ in range(SEED_COUNT):
                year = 2022 + random.randint(0, 4)
                quarter = random.randint(1, 4)
                if (year, quarter) in seen_dt:
                    continue
                seen_dt.add((year, quarter))
                session.add(
                    DimTime(
                        year=year,
                        quarter=quarter,
                        label=f"Q{quarter} {year}",
                    )
                )
            await session.flush()

    print(f"Seed data created: ~{SEED_COUNT} records per table.")
    print("Done.")


def main() -> None:
    asyncio.run(seed_data())


if __name__ == "__main__":
    main()
