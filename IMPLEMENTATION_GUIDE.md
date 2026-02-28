# Aura EPM — Implementation Guide

**Version:** 2.1
**Updated:** 2026-02-28
**Based on:** PROJECT_ASSESSMENT.md findings + Minet Uganda reference documents
**Purpose:** Roadmap, naming guide, hierarchy design, and feature specifications for completing Aura into a fully deployable EPM product.

---

## Table of Contents

1. [Naming Dictionary — System ↔ User-Friendly Terms](#1-naming-dictionary)
2. [Staff Hierarchy Model](#2-staff-hierarchy-model)
3. [Performance Cascade — Top to Bottom](#3-performance-cascade)
4. [New Models Specification](#4-new-models-specification)
5. [Modified Existing Models](#5-modified-existing-models)
6. [Scoring Engine Changes](#6-scoring-engine-changes)
7. [Implementation Phases](#7-implementation-phases)
8. [Scenario Walkthroughs](#8-scenario-walkthroughs)
9. [Setup Guide for Minet Uganda](#9-setup-guide-for-minet-uganda)
10. [UI Pages to Build](#10-ui-pages-to-build)

---

## 1. Naming Dictionary

> **Rule:** The database models keep their technical names internally. The UI, API responses, and all user-facing labels use the friendly names below. This avoids a large rename refactor while making the product understandable to non-technical HR users.

| System / Code Name | User-Facing Name | Also Known As | Where You See It |
|:---|:---|:---|:---|
| `PerformanceCycle` | **Appraisal Period** | Review Year, Cycle | "2025 Annual Appraisal", "Mid-2026" |
| `PerformanceDimension` | **Pillar** | Pillar of Performance | "Financial Pillar", "Client Service Pillar" |
| `ObjectiveGroup` *(new)* | **Objective Area** | Focus Area | "Cost Management", "Client Satisfaction" |
| `ObjectiveTemplate` | **Standard KPI** | KPI Template, Reference Objective | Manager library of pre-defined targets |
| `Objective` | **KPI / Objective** | Target, Goal | "Achieve trading income growth of 15%" |
| `completion_type: binary` | **Milestone (Yes/No)** | Completion Target | Checkbox deliverables |
| `completion_type: numeric` | **Numeric Target** | KPI Target | Revenue, count-based goals |
| `completion_type: percentage` | **Percentage Target** | % Achievement | Directly entered % progress |
| `completion_type: milestone` | **Milestone (Stepped)** | Stage Completion | 25 / 50 / 75 / 100% stages |
| `ObjectiveUpdate` | **Progress Update** | Check-in, Quarterly Update | "Q1 Progress: Achieved 60%" |
| `ObjectiveEvidence` | **Supporting Evidence** | Proof, Attachment | Documents uploaded to support claims |
| `ObjectiveScore` | **Achievement Score** | KPI Score | "Operating Income: 112% achieved" |
| `SelfAssessment` *(new)* | **Self-Evaluation** | Employee Self-Score | Employee's own rating before manager review |
| `BehavioralIndicator` | **Competency** | Behavioral Indicator | "Teamwork", "Client Focus", "Innovation" |
| `BehavioralScore` | **Competency Rating** | Behavioral Score | Manager rates employee 1–5 per competency |
| `PerformanceSummary` | **Appraisal Summary** | PAF Summary, Final Score | The completed Performance Appraisal Form |
| `own_score` *(new field)* | **Personal Score** | Individual Achievement | Based on the person's own objectives only |
| `team_score` *(new field)* | **Team Score** | Direct Reports Average | Average score of people reporting to you |
| `final_weighted_score` | **Overall Score** | Final Rating Score | Weighted combination of personal + team |
| `final_rating_band` | **Performance Rating** | Grade, Band | "Outstanding", "Meets Expectations" |
| `rating_value` *(new field)* | **Rating (1–5)** | Numeric Grade | 1=Unsatisfactory → 5=Outstanding |
| `ReviewSession` | **Appraisal Meeting** | Review Session | Mid-year or final one-on-one meeting |
| `CalibrationSession` | **Calibration Meeting** | Manager Alignment Session | Cross-manager score fairness review |
| `DevelopmentGoal` *(new)* | **Development Area** | Growth Plan, IDP Item | "Improve leadership skills by Q3" |
| `RewardPolicy` | **Rating Band** | Performance Band | Score thresholds → Rating labels |
| `RoleDimensionWeight` | **Pillar Weight** | Dimension Weight | "Financial Pillar = 35% of your score" |
| `RoleDimensionWeight.team_weight_pct` *(new)* | **Team Score Weight** | Team Contribution % | "30% of your score comes from your team" |
| `BaselineSnapshot` | **Starting Point** | Baseline Value | Opening portfolio value, baseline headcount |
| `AuditLog` | **Change History** | Audit Trail | Every change recorded with who/when/what |
| `NotificationRule` | **Reminder Rule** | Alert Setup | "Remind manager when objective is submitted" |
| `cascade_level: company` | **Company-Level** | Strategic | CEO / board-set company objectives |
| `cascade_level: division` | **Division-Level** | Divisional | COO / CFO divisional objectives |
| `cascade_level: department` | **Department-Level** | Team | Manager's department objectives |
| `ObjectiveActivity` *(new)* | **Activity / Task** | Work Item, Action | "Net Promoter Score survey", "Post Renewal Meeting" |
| `activity_type: "scored"` | **Scored Activity** | Measured Work | Has target/actual; contributes to KPI score |
| `activity_type: "task"` | **Task** | Management Task | Binary done/not done; EXCO visibility only |
| `cascade_level: individual` | **Individual-Level** | Personal | Each employee's own objectives |
| `cascade_parent_id` | **Contributes To** | Linked Objective | "This KPI contributes to: [Parent Objective]" |
| `hierarchy_level: executive` | **Executive** | C-Suite | CEO |
| `hierarchy_level: senior_management` | **Senior Management** | Senior Leader | COO, CFO, Directors |
| `hierarchy_level: middle_management` | **Manager** | Department Head | IT Manager, Branch Manager |
| `hierarchy_level: staff` | **Staff** | Employee | Individual contributor |

---

## 2. Staff Hierarchy Model

### 2.1 Hierarchy Levels

Aura supports two independent hierarchy concepts that are often confused:

**A. ORG HIERARCHY (who reports to whom) — drives cascade scoring:**
```
TIER 1: Executive           →  CEO
TIER 2: Senior Management   →  COO, CFO, Directors
TIER 3: Manager             →  Department Heads, Team Leads
TIER 4: Staff               →  Individual Contributors
```

**B. PERFORMANCE HIERARCHY (how KPIs are structured) — 4 levels:**
```
LEVEL 1: Pillar             →  "Client Service" (40%)
LEVEL 2: Objective          →  "Client Satisfaction"
LEVEL 3: KPI / Target       →  "70% Client Satisfaction"     [scored]
LEVEL 4: Activity / Task    →  "Net Promoter Score"          [feeds into KPI score]
                               "Post Renewal Meeting"         [management visibility]
```

Every `Role` must be assigned a `hierarchy_level` (org hierarchy). This drives:
- Which team score weight applies (0% for staff, up to 60% for executives)
- Approval routing (objectives escalate up the supervisor chain)
- Dashboard views (managers see their team; EXCO sees the full org)

### 2.2 Minet Uganda Org Chart (Example)

```
Organization: Minet Uganda
│
├── CEO [Executive]
│   Supervisor: (none — Board)
│
├── COO [Senior Management]
│   Supervisor: CEO
│   │
│   ├── Operations Manager [Manager]
│   │   Supervisor: COO
│   │   ├── Client Relations Officer [Staff]
│   │   ├── Client Relations Officer [Staff]
│   │   └── Operations Assistant [Staff]
│   │
│   └── HR Manager [Manager]
│       Supervisor: COO
│       ├── HR Officer [Staff]
│       └── HR Assistant [Staff]
│
└── CFO [Senior Management]
    Supervisor: CEO
    │
    ├── Finance Manager [Manager]
    │   Supervisor: CFO
    │   ├── Accountant [Staff]
    │   └── Finance Assistant [Staff]
    │
    └── IT Manager [Manager]   ← (HS: the system owner)
        Supervisor: CFO
        ├── IT Officer [Staff]
        └── IT Support [Staff]
```

### 2.3 Data Representation

Each person in the system is a `User` with:
- `role_id` → their job role (e.g., "IT Manager")
- `department_id` → their department (e.g., "IT Department")
- `supervisor_id` → their direct manager's User ID

The `Role` model gets a `hierarchy_level` enum:
- `executive` → CEO
- `senior_management` → COO, CFO
- `middle_management` → Department Managers
- `staff` → Individual Contributors

**The `supervisor_id` chain IS the org chart.** Aura traverses this chain to:
1. Route approval requests up the hierarchy
2. Pull direct reports for team score calculation
3. Determine cascade levels for objective linking

---

## 3. Performance Cascade

### 3.1 Overview

Performance cascades in two directions simultaneously:

```
GOAL SETTING (Top → Down):          SCORE AGGREGATION (Bottom → Up):
─────────────────────────────        ─────────────────────────────────
CEO sets company pillars             Staff individual scores computed
    ↓                                    ↑
COO/CFO set divisional goals         Manager: own + team avg (70/30)
    ↓                                    ↑
Managers set dept objectives         COO/CFO: own + team avg (50/50)
    ↓                                    ↑
Staff set personal KPIs              CEO: own + team avg (40/60)
```

### 3.2 Goal Cascade (Top-Down Objective Linking)

Each `Objective` can optionally link to a `cascade_parent_id` (another Objective at a higher level).

**Example cascade chain:**

```
[COMPANY] CEO Objective:
  "Achieve company-wide revenue growth of 20%"
  (cascade_level: company, cascade_parent_id: null)
       │
       ├── [DIVISION] CFO Objective:
       │   "Grow premium income by 18%"
       │   (cascade_level: division, cascade_parent_id: CEO_obj_id)
       │        │
       │        └── [DEPARTMENT] Finance Manager Objective:
       │            "Maintain policy renewal rate at 85%"
       │            (cascade_level: department, cascade_parent_id: CFO_obj_id)
       │                 │
       │                 └── [INDIVIDUAL] Accountant Objective:
       │                     "Process 95% of renewals within SLA"
       │                     (cascade_level: individual, cascade_parent_id: mgr_obj_id)
       │
       └── [DIVISION] COO Objective:
           "Expand to 2 new client segments"
           (cascade_level: division, cascade_parent_id: CEO_obj_id)
                │
                └── [DEPARTMENT] Operations Manager Objective:
                    "Onboard 50 new corporate clients"
                    (cascade_level: department, cascade_parent_id: COO_obj_id)
                         │
                         └── [INDIVIDUAL] Client Relations Officer:
                             "Onboard 15 new corporate clients (own portfolio)"
                             (cascade_level: individual, cascade_parent_id: mgr_obj_id)
```

**Rules:**
- Cascade links are **optional** — objectives don't have to be linked
- A division/department/individual may link to any higher-level objective
- Cascade is visibility + context, not mathematical contribution
- The **score** aggregation (section 3.3) is what makes performance reflect up and down

### 3.3 Score Cascade (Bottom-Up Aggregation)

#### How Team Score Is Calculated

When computing `PerformanceSummary` for a manager:

```
personal_score = weighted avg of own objectives (existing logic)

team_score = average(final_weighted_score of all direct reports)

final_weighted_score = (personal_score × own_weight_pct)
                     + (team_score    × team_weight_pct)

where own_weight_pct + team_weight_pct = 100%
```

**Weight configuration (stored on `Role`):**

| Role Hierarchy Level | Default Own % | Default Team % | Rationale |
|:---|:---|:---|:---|
| `staff` | 100% | 0% | Pure individual contributor |
| `middle_management` | 70% | 30% | Accountable for own work + team delivery |
| `senior_management` | 50% | 50% | Primarily drives results through people |
| `executive` | 40% | 60% | Org-wide outcome, heavily team-dependent |

These are defaults. Each `Role` can have its `team_weight_pct` customized.

#### Example: Minet Uganda Score Rollup

```
IT Support (Staff)          → personal: 82%  | team: n/a  | final: 82%
IT Officer (Staff)          → personal: 75%  | team: n/a  | final: 75%
                                                               ↓
IT Manager (Manager)        → personal: 79%  | team: avg(82,75)=78.5% | final: (79*70%)+(78.5*30%)=79%
Finance Manager (Manager)   → personal: 88%  | team: 85%              | final: (88*70%)+(85*30%)=87%
                                                                               ↓
CFO (Senior Management)     → personal: 91%  | team: avg(79,87)=83%   | final: (91*50%)+(83*50%)=87%
COO (Senior Management)     → personal: 85%  | team: 80%              | final: (85*50%)+(80*50%)=82.5%
                                                                                         ↓
CEO (Executive)             → personal: 88%  | team: avg(87,82.5)=84.75% | final: (88*40%)+(84.75*60%)=86%
```

This means: **the CEO's final score (86%) genuinely reflects what's happening across the whole organization.**

#### Timing of Team Score Computation

Team scores are computed in order, bottom-up:
1. First: compute all `staff` personal scores
2. Then: compute all `middle_management` personal + team scores
3. Then: compute all `senior_management` personal + team scores
4. Finally: compute `executive` personal + team scores

The `compute_summary` API endpoint must detect hierarchy and sequence accordingly.

### 3.4 Rating Scale (1–5 from %)

Based on the CEO's PAF (Mgt.xlsx), the standard 5-point scale maps to % achievement:

| Rating Value | Rating Label | Score Range | Colour |
|:---|:---|:---|:---|
| 5 | Outstanding | ≥ 121% | 🟢 Dark Green |
| 4 | Exceeds Expectations | 106% – 120% | 🟩 Green |
| 3 | Meets Expectations | 91% – 105% | 🟡 Amber |
| 2 | Below Expectations | 76% – 90% | 🟠 Orange |
| 1 | Unsatisfactory | < 75% | 🔴 Red |

These are configured as `RewardPolicy` entries. A `rating_value` (1–5 integer) is added so the UI can display both the label and the numeric grade.

---

## 4. New Models Specification

### 4.1 `ObjectiveGroup` (maps to "Objective Area")

**Purpose:** Creates the 3-tier hierarchy: Pillar → Objective Area → KPI. Matches the "groups" in Objective Templates.csv (e.g., "Client Satisfaction" grouping NPS, Risk Survey, Doc-it Compliance KPIs).

```python
class ObjectiveGroup(CuidMixin, TimestampMixin, Base):
    __tablename__ = "objective_groups"

    dimension_id: str         # FK → performance_dimensions (RESTRICT)
    name: str                 # "Client Satisfaction", "Cost Management"
    description: str | None
    default_weight_pct: Decimal   # Weight of this group within the Pillar (must sum to 100% per dimension)
    sort_order: int           # Display ordering within Pillar
    is_active: bool           # default True
```

**Usage:**
- `Objective.group_id` (nullable FK → `objective_groups`) — assigns an objective to a group
- Groups are displayed as collapsible sections on the objectives list
- A group's score = weighted avg of its member objectives' scores

**Relationships:**
- `dimension` → PerformanceDimension
- `objectives` → list[Objective]

---

### 4.2 `SelfAssessment` (maps to "Self-Evaluation")

**Purpose:** Employee self-rates their objectives before the manager review. This creates the dual-column PAF format used in Mgt.xlsx.

```python
class SelfAssessment(CuidMixin, TimestampMixin, Base):
    __tablename__ = "self_assessments"
    __table_args__ = UniqueConstraint(user_id, performance_cycle_id)

    user_id: str              # FK → users (CASCADE)
    performance_cycle_id: str # FK → performance_cycles (CASCADE)

    # Overall self-rating
    self_score: Decimal | None         # 0–100, overall % or weighted avg
    self_rating_value: int | None      # 1–5 numeric rating

    # Per-pillar self-evaluation (stored as JSON array for flexibility)
    pillar_comments: dict | None       # {"pillar_id": "I exceeded targets in Q2..."}

    # Development section (from Mgt.xlsx "Areas for Development")
    strengths: str | None              # What went well
    development_areas: str | None      # What needs improvement
    career_aspirations: str | None     # Where they want to go
    support_needed: str | None         # What support they need from the org

    status: str               # "draft" | "submitted"
    submitted_at: datetime | None

    # Manager response (filled in during review meeting)
    manager_agrees: bool | None        # Does manager broadly agree with self-eval?
    manager_response: str | None       # Manager's comments on the self-evaluation
```

**Workflow:**
1. Employee opens self-evaluation form (draft)
2. Employee rates themselves and fills development section
3. Employee submits (status → submitted)
4. Manager sees self-eval alongside their own objective scores during appraisal
5. Manager records whether they agree + response

---

### 4.3 `DevelopmentGoal` (maps to "Development Area")

**Purpose:** Documents the individual development plan arising from the appraisal. Matches the "Areas of Development", "Potential Assessment", and career sections in Mgt.xlsx.

```python
class DevelopmentGoal(CuidMixin, TimestampMixin, Base):
    __tablename__ = "development_goals"

    user_id: str              # FK → users (CASCADE)
    performance_cycle_id: str # FK → performance_cycles (CASCADE)

    area: str                 # "Leadership", "Technical Skills", "Client Relationships"
    goal: str                 # "Complete a leadership course by June 2025"
    action_plan: str | None   # Specific steps to achieve the goal
    support_required: str | None  # "Sponsor for ACII exam", "External training budget"
    target_completion: date | None
    status: str               # "planned" | "in_progress" | "completed" | "deferred"
    outcome: str | None       # What actually happened (filled at cycle end)

    # Potential assessment (from Mgt.xlsx)
    potential_rating: str | None   # "High", "Medium", "Low" / "Promotable", "Ready in 2 Years"
    readiness_timeline: str | None # "Ready now", "Ready in 1 year", "Ready in 2+ years"

    # Approval
    manager_id: str | None    # FK → users (SET NULL) — who documented this
    approved_at: datetime | None
```

**Usage:**
- Created by manager (or collaboratively with employee) during or after appraisal
- Multiple development goals per person per cycle
- Status tracked through the year
- Outcome filled at cycle close
- Feeds into succession planning views

---

### 4.4 `EmployeeAcknowledgment` (maps to "Sign-Off")

**Purpose:** Records that the employee has seen and acknowledged their final appraisal. Legal/compliance requirement matching the signature section of Mgt.xlsx.

```python
class EmployeeAcknowledgment(CuidMixin, TimestampMixin, Base):
    __tablename__ = "employee_acknowledgments"
    __table_args__ = UniqueConstraint(user_id, performance_cycle_id)

    user_id: str              # FK → users (CASCADE)
    performance_cycle_id: str # FK → performance_cycles (CASCADE)
    performance_summary_id: str  # FK → performance_summaries (CASCADE)

    acknowledged: bool        # default False
    acknowledged_at: datetime | None
    employee_comment: str | None  # Final employee statement
    agrees_with_rating: bool | None  # Does employee agree? (optional)
    dispute_reason: str | None      # If disagrees, why
```

**Workflow:**
1. Manager completes and HR approves `PerformanceSummary`
2. System notifies employee that their appraisal is ready for review
3. Employee logs in, reads final summary, clicks "Acknowledge"
4. `EmployeeAcknowledgment.acknowledged = True` — cycle is complete for that person

---

### 4.5 `ObjectiveActivity` (maps to "Activity" / "Task")

**Purpose:** The 4th and most granular tier of the performance hierarchy. Activities are the actual work items employees perform to achieve a KPI. Management and EXCO see these to verify the *how*, not just the *what*.

**Discovered from Objective Templates.csv structure:**
```
Column 1: Pillar       → "Client Service"
Column 2: Objective    → "Client Satisfaction"
Column 3: Target/KPI   → "70% Client Satisfaction"   ← measurable goal
Column 4: Activity     → "Net Promoter Score"          ← HOW you achieve it
Column 5: Act. Weight  → 5                             ← activity weight within KPI
Column 6: Obj. Weight  → 5                             ← KPI weight within Pillar
```

**Two activity types:**

| Type | Code | Description | Scoring | EXCO View |
|:---|:---|:---|:---|:---|
| **Scored Activity** | `"scored"` | Has its own target/actual. Weight counted toward KPI score. | ✅ Yes — weighted contribution | ✅ Full detail |
| **Task** | `"task"` | Binary done/not done checklist. Proves work is happening. | ❌ No — visibility only | ✅ Status + verification |

```python
class ObjectiveActivity(CuidMixin, TimestampMixin, Base):
    __tablename__ = "objective_activities"

    objective_id: str         # FK → objectives (CASCADE) — the parent KPI
    title: str                # "Net Promoter Score", "Post Renewal Meeting"
    description: str | None

    # Type — determines scoring behaviour
    activity_type: str        # "scored" | "task"

    # Scoring (scored activities only)
    weight: Decimal | None    # Relative weight within KPI (normalised at compute time)
    completion_type: str      # "numeric" | "binary" | "percentage" | "milestone"
    target_value: Decimal | None
    actual_value: Decimal | None
    unit_of_measure: str | None

    # Timeline
    due_date: date | None

    # Status
    status: str               # "not_started" | "in_progress" | "completed" | "blocked"

    # Manager oversight (the key EXCO/management visibility feature)
    manager_verified: bool    # Has manager confirmed this was done properly?
    manager_verified_by: str | None   # FK → users
    manager_verified_at: datetime | None
    manager_notes: str | None        # "NPS survey sent but sample too small"

    sort_order: int           # Display ordering within the parent KPI
```

**Scoring cascade (how activities feed into KPIs):**

```
If KPI has scored activities:
  1. Normalise activity weights to sum to 100%
  2. Compute each activity's achievement % (same rules as KPI scoring)
  3. KPI achievement % = weighted average of activity achievement %s
  4. KPI weighted score = (KPI achievement % × KPI weight) / 100

If KPI has NO scored activities (or only "task" type):
  → Fall back to direct KPI scoring: (KPI actual / KPI target) × 100
```

**Example from Objective Templates.csv — "Doc-It Compliance" KPI:**
```
KPI: "100% Doc-It Compliance" (weight: 20 within Operational Excellence)
  Activity: "Doc-It Audit - Qualitative"  | scored | weight: 10 | target: 100%
  Activity: "Doc-It Audit - Quantitative" | scored | weight: 10 | target: 100%

Normalised weights: 50% each
If Qualitative = 85%, Quantitative = 92%:
  KPI achievement = (85×0.5) + (92×0.5) = 88.5%
  KPI weighted score = (88.5 × 20) / 100 = 17.7
```

**Example — "Client Retention" KPI (task-type activities):**
```
KPI: "Client Retention" (target: 90% renewal rate, weight: 5)
  Activity: "Post Renewal Meeting"  | task | no scoring
  Activity: "Renewal Meeting"       | task | no scoring
  Activity: "Review Meeting"        | task | no scoring
  Activity: "Sensitisation"         | task | no scoring

→ Management sees which meetings were held + manager verification
→ KPI score uses direct actual (renewal rate %) vs. target (90%)
→ Tasks are evidence of HOW the retention rate was pursued
```

**What management/EXCO see:**
- A KPI card shows the score + a collapsible list of activities beneath it
- Each activity shows: status badge (green/amber/red), due date, manager-verified tick
- Filter view: "Show all unverified activities" → EXCO compliance check
- Manager can click "Verify" on each activity + add a comment
- Activities flagged "Blocked" surface to dashboard alerts


## 5. Modified Existing Models

### 5.1 `Role` — Add Hierarchy Level & Team Weight

Add the following fields to the `roles` table:

```python
# Hierarchy tier (determines scoring behaviour and cascade level)
hierarchy_level: str    # "executive" | "senior_management" | "middle_management" | "staff"
                        # default: "staff"

# What % of the final score comes from the team's performance
team_weight_pct: Decimal   # 0–100, default 0 (staff have 0)
                            # Manager default: 30
                            # Senior Management default: 50
                            # Executive default: 60
```

### 5.2 `Objective` — Add Cascade, Group, Completion Type

Add the following fields to the `objectives` table:

```python
# Objective grouping (3-tier hierarchy)
group_id: str | None    # FK → objective_groups (SET NULL)
                        # Groups objectives into Objective Areas within a Pillar

# Cascade linking (top-down goal alignment)
cascade_level: str      # "company" | "division" | "department" | "individual"
                        # default: "individual"

cascade_parent_id: str | None   # FK → objectives.id (SET NULL, self-join)
                                # Links this objective to a higher-level parent objective
                                # Visibility/context only — does not affect scoring math

# Completion type (how progress is measured)
completion_type: str    # "numeric" | "binary" | "percentage" | "milestone"
                        # default: "numeric"
                        # numeric:    (actual / target) × 100
                        # binary:     0% or 100% (done/not done checkbox)
                        # percentage: user enters % directly (0–100)
                        # milestone:  stepped: 0/25/50/75/100
```

### 5.3 `PerformanceSummary` — Add Cascade Scores & Acknowledgment

Add the following fields to the `performance_summaries` table:

```python
# Cascade scoring components
own_score: Decimal | None        # Score from personal objectives only (existing logic)
team_score: Decimal | None       # Average of direct reports' final_weighted_scores
                                 # null for staff-level users (team_weight_pct = 0)
team_weight_pct_used: Decimal | None  # The actual weight used (copied from Role at time of compute)

# Final numeric rating (1–5 from RewardPolicy)
rating_value: int | None         # 1=Unsatisfactory, 2=Below, 3=Meets, 4=Exceeds, 5=Outstanding

# Employee acknowledgment tracking
employee_acknowledged: bool      # default False
employee_acknowledged_at: datetime | None
```

### 5.4 `RewardPolicy` — Add Rating Label & Numeric Value

Add the following fields to the `reward_policies` table:

```python
rating_label: str        # "Outstanding" | "Exceeds Expectations" | "Meets Expectations" |
                         # "Below Expectations" | "Unsatisfactory"
rating_value: int        # 1–5 numeric (matching Mgt.xlsx scale)
color_hex: str | None    # "#2e7d32" (green), "#f57c00" (amber), "#c62828" (red) for UI
```

---

## 6. Scoring Engine Changes

### 6.0 Activity → KPI Score Cascade (NEW)

When a KPI (Objective) has **scored** activities:

```
1. Filter activities where activity_type = "scored" and weight is not null
2. Normalise weights: each activity's normalised_weight = (raw_weight / total_raw_weight) × 100
3. Compute each activity's achievement % using the same completion_type rules
4. KPI achievement % = sum(activity_achievement % × normalised_weight / 100)
5. KPI weighted score = (KPI achievement % × KPI weight) / 100
```

When a KPI has **only task activities or no activities at all**:
→ Fall back to direct KPI scoring using the KPI's own actual vs. target.

This is implemented in `compute_kpi_from_activities()` in `domain/scoring.py`.

---

### 6.1 Completion Type Scoring

The `compute_score()` function in `domain/scoring.py` branches on `completion_type`:

```
completion_type = "numeric":
  achievement_pct = (actual / target) × 100
  capped to [0, 150]

completion_type = "binary":
  achievement_pct = 100 if actual >= 1 else 0

completion_type = "percentage":
  achievement_pct = actual (directly entered, capped to [0, 150])

completion_type = "milestone":
  achievement_pct = actual (must be one of: 0, 25, 50, 75, 100)
  validated at update time

weighted_score = (achievement_pct × weight) / 100     # same for all types
```

### 6.2 Cascade Summary Computation

New function `compute_cascade_summary(user_id, cycle_id, session)`:

```
1. Fetch user's Role → get team_weight_pct
2. If team_weight_pct == 0:
     own_score = existing personal score computation
     team_score = null
     final = own_score

3. If team_weight_pct > 0:
     a. Ensure all direct reports have computed PerformanceSummary first
        (recursive: call compute_cascade_summary for each direct report if needed)
     b. own_score = weighted avg of user's own objective scores
     c. team_score = avg(direct_report.final_weighted_score for all direct reports)
     d. own_weight = 100 - team_weight_pct
     e. final = (own_score × own_weight/100) + (team_score × team_weight_pct/100)

4. Lookup RewardPolicy for final score → rating_band + rating_value
5. Save PerformanceSummary with own_score, team_score, final_weighted_score,
   final_rating_band, rating_value, team_weight_pct_used
```

**Important:** The compute endpoint must process hierarchy bottom-up:
- Sort users by `role.hierarchy_level` depth (staff first, executives last)
- Use recursive computation with cycle-detection guard

### 6.3 Self-Assessment Visibility (No Score Impact)

The self-evaluation score (`SelfAssessment.self_score`) is **displayed** alongside the system score but does NOT affect the computed score. HR may use the gap (self vs system) as a discussion prompt, but it's not mathematically combined.

---

## 7. Implementation Phases

### Phase A — Foundation (Do Now, ~1 week)

Unblocks the most critical UX gaps without breaking anything existing.

| # | Task | New File / Changed File | Priority |
|:---|:---|:---|:---|
| A1 | Add `hierarchy_level` + `team_weight_pct` to `Role` | `models/role.py` | 🔴 Critical |
| A2 | Add `group_id`, `cascade_level`, `cascade_parent_id`, `completion_type` to `Objective` | `models/objective.py` | 🔴 Critical |
| A3 | Create `ObjectiveGroup` model | `models/objective_group.py` | 🔴 Critical |
| A4 | Add `own_score`, `team_score`, `rating_value`, `employee_acknowledged` to `PerformanceSummary` | `models/performance_summary.py` | 🔴 Critical |
| A5 | Add `rating_label`, `rating_value`, `color_hex` to `RewardPolicy` | `models/reward_policy.py` | 🔴 Critical |
| A6 | Write Alembic migration `019` | `migrations/versions/019_hierarchy_cascade.py` | 🔴 Critical |
| A7 | Update scoring engine for completion types | `domain/scoring.py` | 🔴 Critical |
| A8 | Implement cascade summary computation | `domain/scoring.py` (new function) | 🔴 Critical |
| A9 | Register new models in `__init__.py` | `models/__init__.py` | 🔴 Critical |
| A10 | Create `ObjectiveActivity` model | `models/objective_activity.py` | 🔴 Critical |
| A11 | Update scoring engine with `compute_kpi_from_activities()` | `domain/scoring.py` | 🔴 Critical |
| A12 | Write Alembic migration `020` for objective_activities | `migrations/versions/020_objective_activities.py` | 🔴 Critical |

### Phase B — Self-Assessment & Development (Week 2)

Completes the full PAF workflow.

| # | Task | New File / Changed File | Priority |
|:---|:---|:---|:---|
| B1 | Create `SelfAssessment` model | `models/self_assessment.py` | 🟠 High |
| B2 | Create `DevelopmentGoal` model | `models/development_goal.py` | 🟠 High |
| B3 | Create `EmployeeAcknowledgment` model | `models/employee_acknowledgment.py` | 🟠 High |
| B4 | Repositories for new models | `repositories/self_assessment_repo.py` etc. | 🟠 High |
| B5 | API endpoints for self-assessment | `endpoints/self_assessments.py` | 🟠 High |
| B6 | API endpoints for development goals | `endpoints/development_goals.py` | 🟠 High |
| B7 | API endpoint for acknowledgment | `endpoints/acknowledgments.py` | 🟠 High |
| B8 | Alembic migration `020` | `migrations/versions/020_self_assessment_development.py` | 🟠 High |

### Phase C — Notifications & Bulk Import (Week 3)

Activates the system as a live operational tool.

| # | Task | Notes | Priority |
|:---|:---|:---|:---|
| C1 | Email notification delivery (Resend/SMTP) | Wire to existing `NotificationOutbox` | 🟠 High |
| C2 | CSV bulk import — Users | `/api/v1/import/users` (CSV: name, email, role, dept, supervisor) | 🟠 High |
| C3 | CSV bulk import — Objectives | `/api/v1/import/objectives` (matches template CSV format) | 🟠 High |
| C4 | Background job runner (ARQ or FastAPI lifespan tasks) | 90-day flag, ETL refresh, notification dispatch | 🟡 Medium |
| C5 | In-app notification bell (frontend) | Unread count badge, dropdown list | 🟡 Medium |

### Phase D — Dashboard & Analytics (Week 4)

Makes the system feel like a product, not a database.

| # | Task | Notes | Priority |
|:---|:---|:---|:---|
| D1 | User dashboard: score progress, pillars radar, deadlines | Frontend priority | 🟠 High |
| D2 | Objectives list: grouped by Pillar → Area → KPI | Collapsible hierarchy | 🟠 High |
| D3 | Cascade view: "Contributes To" chain visualization | Tree diagram or breadcrumb | 🟡 Medium |
| D4 | Calibration analytics dashboard | Histograms, dept comparison, outlier flags | 🟡 Medium |
| D5 | Manager view: team performance summary | Each direct report's progress + team score | 🟠 High |
| D6 | PDF export of completed PAF | Matches Mgt.xlsx layout | 🟡 Medium |

### Phase E — Setup Wizard & Polish (Week 5+)

Makes onboarding feasible without a developer.

| # | Task | Notes |
|:---|:---|:---|
| E1 | First-run setup wizard (frontend) | Org → Departments → Roles → Dimensions → Templates |
| E2 | Org chart visualization | Tree view of supervisor hierarchy |
| E3 | Mobile-responsive UI | Priority for field managers |
| E4 | Integration testing suite | Full lifecycle: seed → objectives → score → summary |
| E5 | API documentation (auto-generated Swagger) | FastAPI OpenAPI — already partial |

---

## 8. Scenario Walkthroughs

### 8.1 CEO's Manager PAF (Mgt.xlsx) — Full Workflow in Aura

**Setup (Admin, once per cycle):**
1. Create `PerformanceCycle` → "2025 Annual Appraisal" (start: Jan 1, end: Dec 31)
2. Create `PerformanceDimension` (Pillars):
   - "Financial" | default_weight_pct: 35
   - "Innovation" | default_weight_pct: 10
   - "Client Value" | default_weight_pct: 20
   - "Operational Excellence" | default_weight_pct: 20
   - "Talent Development" | default_weight_pct: 10
   - *(Note: these are set as defaults; Role-level weights override for specific roles)*
3. Create `ObjectiveGroup` (Objective Areas) within each Pillar
4. Create `ObjectiveTemplate` (Standard KPIs) within each group
5. Set `RewardPolicy` entries:
   - >121%  → rating_label: "Outstanding",           rating_value: 5
   - 106-120% → rating_label: "Exceeds Expectations",  rating_value: 4
   - 91-105% → rating_label: "Meets Expectations",    rating_value: 3
   - 76-90% → rating_label: "Below Expectations",    rating_value: 2
   - <75%   → rating_label: "Unsatisfactory",         rating_value: 1

**During Cycle (Manager):**
1. Manager creates `Objective` records (using Standard KPIs as templates)
2. Q1: Manager submits objectives → HR/supervisor approves
3. Objectives lock after Q1
4. Quarterly: Manager logs `ObjectiveUpdate` (actual values)
5. Year-end: Manager fills `SelfAssessment` (self-rating + development areas)

**Review Process:**
1. Manager's supervisor creates `ReviewSession` (appraisal meeting)
2. System computes `ObjectiveScore` for each objective
3. System computes `PerformanceSummary`:
   - `own_score` = weighted avg of objectives by pillar
   - `team_score` = avg of direct reports' final scores
   - `final_weighted_score` = (own × role_own_pct) + (team × role_team_pct)
   - `rating_value` → 1–5 from RewardPolicy
4. HR reviews and sets `hr_approved = True`
5. Employee receives notification → opens acknowledgment → clicks "I Acknowledge"
6. `EmployeeAcknowledgment.acknowledged = True` — cycle complete

---

### 8.2 Objective Templates (Objective Templates.csv) — Full 4-Level Mapping

The CSV has exactly 4 levels with two weight columns:
- **Column 5** = Activity weight within the KPI
- **Column 6** = KPI/Objective weight within the Pillar (shown only on first activity row)

```
CSV Structure                              Aura Structure (4 Levels)
─────────────────────────────────────      ─────────────────────────────────────────────────
Pillar: Client Service (40%)           →   PerformanceDimension "Client Service"
                                           RoleDimensionWeight: 40%

  Objective: Client Satisfaction       →   ObjectiveGroup "Client Satisfaction"

    Target: 70% Client Satisfaction    →   Objective (KPI) | weight: 5 | type: percentage
                                           target_value: 70, unit: "%"
      Activity: Net Promoter Score     →   ObjectiveActivity | type: scored | weight: 5
                                           (NPS survey score feeds into 70% target)

    Target: Achieve Client Promise 90% →   Objective (KPI) | weight: 10 | type: percentage
                                           target_value: 90, unit: "%"
      Activity: Risk Survey Report     →   ObjectiveActivity | type: scored | weight: 5
      Activity: Risk Surveys           →   ObjectiveActivity | type: scored | weight: 5

    Target: Client Retention           →   Objective (KPI) | weight: 20 | type: percentage
                                           target_value: 85, unit: "% renewal"
      Activity: Post Renewal Meeting   →   ObjectiveActivity | type: task (visibility)
      Activity: Renewal Meeting        →   ObjectiveActivity | type: task (visibility)
      Activity: Review Meeting         →   ObjectiveActivity | type: task (visibility)
      Activity: Sensitisation          →   ObjectiveActivity | type: task (visibility)

  Objective: Innovation                →   ObjectiveGroup "Innovation"

    Target: Create & Innovate          →   Objective (KPI) | weight: 2 | type: binary
      Activity: Product Development    →   ObjectiveActivity | type: scored | weight: 1
      Activity: Product Enhancement    →   ObjectiveActivity | type: scored | weight: 1

    Target: Digital Transformation     →   Objective (KPI) | weight: 3 | type: percentage
      Activity: Digital Marketing      →   ObjectiveActivity | type: scored | weight: 1.5
      Activity: Promote Digital Sols   →   ObjectiveActivity | type: scored | weight: 1
      Activity: Propose Digital Sols   →   ObjectiveActivity | type: scored | weight: 0.5

Pillar: Financial (10%)                →   PerformanceDimension "Financial"

  Objective: Achieve Dept Budget       →   ObjectiveGroup "Department Budget"

    Target: New Business Pipeline      →   Objective (KPI) | weight: 1 | type: numeric
      Activity: Market Intelligence    →   ObjectiveActivity | type: scored | weight: 0.25
      Activity: Pipeline Development   →   ObjectiveActivity | type: scored | weight: 0.5
      Activity: Tendering              →   ObjectiveActivity | type: scored | weight: 0.25

    Target: Organic Growth (UGX)       →   Objective (KPI) | weight: 2 | type: numeric
      Activity: Client Review          →   ObjectiveActivity | type: task

    Target: Retention (UGX)            →   Objective (KPI) | weight: 5 | type: numeric
      Activity: Budget Analysis        →   ObjectiveActivity | type: scored | weight: 5

Pillar: Operational Excellence (40%)   →   PerformanceDimension "Operational Excellence"

  Objective: Doc-It Compliance         →   ObjectiveGroup "Doc-It Compliance"

    Target: 100% Doc-It Compliance     →   Objective (KPI) | weight: 20 | type: percentage
      Activity: Doc-It Audit Qual.     →   ObjectiveActivity | type: scored | weight: 10
      Activity: Doc-It Audit Quant.    →   ObjectiveActivity | type: scored | weight: 10

  Objective: Insurer Engagement        →   ObjectiveGroup "Insurer Engagement"

    Target: Monthly Insurer Meetings   →   Objective (KPI) | weight: 5 | type: numeric
      Activity: Document Notes         →   ObjectiveActivity | type: task
      Activity: Schedule Meetings      →   ObjectiveActivity | type: task
      Activity: Set Agenda             →   ObjectiveActivity | type: task

  Objective: Operational Procedures    →   ObjectiveGroup "Operational Procedures"

    Target: Broking SOP Compliance     →   Objective (KPI) | weight: 10 | type: percentage
      Activity: GAMS                   →   ObjectiveActivity | type: scored | weight: 1
      Activity: Invoice Issuance       →   ObjectiveActivity | type: scored | weight: 2
      Activity: Policy Issuance        →   ObjectiveActivity | type: scored | weight: 2
      Activity: Quotation Issuance     →   ObjectiveActivity | type: scored | weight: 2
      Activity: KYC Update             →   ObjectiveActivity | type: scored | weight: 1
      Activity: SLA Signing            →   ObjectiveActivity | type: scored | weight: 2

    Target: Claims SOP Compliance      →   Objective (KPI) | weight: 5 | type: percentage
      Activity: Claims Meeting         →   ObjectiveActivity | type: task
      Activity: Review Claims Report   →   ObjectiveActivity | type: task

  Objective: Credit Control            →   ObjectiveGroup "Credit Control"

    Target: 90% Premium Collection     →   Objective (KPI) | weight: 5 | type: percentage
      Activity: Account Reconciliation →   ObjectiveActivity | type: scored | weight: 2.5
```

**Key design decisions:**
1. **Scored activities** (have a weight column value) feed mathematically into the KPI score via weighted average
2. **Task activities** (no weight, or purely action-based) are tracked for management visibility but don't affect the score
3. The KPI's `target_value` / `actual_value` are still used when there are NO scored activities
4. When scored activities exist, the activities' weighted average IS the KPI's achievement %
5. Manager can verify each activity individually — critical for compliance-heavy pillars like Doc-It

---

### 8.3 IT Objectives (Objectives HS.csv) — The IT Manager's Setup

With 94 individual targets, the grouping is critical.

**Pillars & Groups:**

```
Pillar: Financial (20%)
  Group: Cost Control & Reduction         →  objectives: cost targets
  Group: Budget Compliance                →  objectives: budget vs. actual

Pillar: Client Value (30%)
  Group: Service Delivery                 →  objectives: SLA metrics, ticket resolution
  Group: System Availability              →  objectives: uptime targets
  Group: Stakeholder Satisfaction         →  objectives: NPS, survey scores

Pillar: Operational Excellence (40%)
  Group: Data & Analytics                 →  objectives: DW, ETL, dashboards
  Group: IT Infrastructure                →  objectives: server migrations, DR plan
  Group: Process Automation               →  objectives: automation deliverables
  Group: Policy & Compliance              →  objectives: ISO, policy review, audits

Pillar: Talent Management (10%)
  Group: Team Development                 →  objectives: training hours, certifications
  Group: Personal Development             →  objectives: own courses, certifications
```

**Completion Types:**
- "Achieve IT cost reduction of 10%" → `completion_type: numeric`
- "Submit IT asset inventory by Aug 31" → `completion_type: binary`
- "Staff IT satisfaction score ≥ 4/5" → `completion_type: numeric`
- "Complete Phase 1 of DW by Q2" → `completion_type: milestone` (Q1=25%, Q2=50%, Q3=75%, Q4=100%)
- "Network uptime ≥ 99.5%" → `completion_type: percentage` (direct entry)

**Cascade Links:**
- IT Manager's "Reduce IT costs by 15%" → cascade_parent: CFO's "Reduce overheads by 10%"
- IT Manager's "Deliver BI dashboard" → cascade_parent: CFO's "Improve management reporting"

---

## 9. Setup Guide for Minet Uganda

### Step 1: Run Initial Seed

```bash
uv run python -m app.scripts.seed_admin
```

This creates the admin account (`admin@example.com` / `admin`). **Change the password immediately.**

### Step 2: Create Organization Structure (via Admin UI or API)

```
POST /api/v1/organizations
  { "name": "Minet Uganda" }

POST /api/v1/departments
  { "name": "Executive", "organization_id": "..." }
  { "name": "Operations", "organization_id": "..." }
  { "name": "Finance & IT", "organization_id": "..." }
  { "name": "HR", "organization_id": "..." }
```

### Step 3: Create Roles with Hierarchy Levels

```
POST /api/v1/roles
  { "name": "CEO",               "hierarchy_level": "executive",         "team_weight_pct": 60, "is_managerial": true  }
  { "name": "COO",               "hierarchy_level": "senior_management", "team_weight_pct": 50, "is_managerial": true  }
  { "name": "CFO",               "hierarchy_level": "senior_management", "team_weight_pct": 50, "is_managerial": true  }
  { "name": "Operations Manager","hierarchy_level": "middle_management", "team_weight_pct": 30, "is_managerial": true  }
  { "name": "IT Manager",        "hierarchy_level": "middle_management", "team_weight_pct": 30, "is_managerial": true  }
  { "name": "Finance Manager",   "hierarchy_level": "middle_management", "team_weight_pct": 30, "is_managerial": true  }
  { "name": "HR Manager",        "hierarchy_level": "middle_management", "team_weight_pct": 30, "is_managerial": true  }
  { "name": "Officer",           "hierarchy_level": "staff",             "team_weight_pct": 0,  "is_managerial": false }
  { "name": "Assistant",         "hierarchy_level": "staff",             "team_weight_pct": 0,  "is_managerial": false }
```

### Step 4: Create Users (or CSV Import)

Assign each user their role, department, and supervisor. The supervisor chain builds the org chart.

```
POST /api/v1/users
  { "name": "CEO Name",   "email": "ceo@minet.ug",  "role_id": "CEO_role_id",    "supervisor_id": null }
  { "name": "COO Name",   "email": "coo@minet.ug",  "role_id": "COO_role_id",    "supervisor_id": "CEO_id" }
  { "name": "CFO Name",   "email": "cfo@minet.ug",  "role_id": "CFO_role_id",    "supervisor_id": "CEO_id" }
  { "name": "IT Mgr",     "email": "hs@minet.ug",   "role_id": "IT_Mgr_role_id", "supervisor_id": "CFO_id" }
  { "name": "IT Officer", "email": "it1@minet.ug",  "role_id": "Officer_role_id","supervisor_id": "IT_Mgr_id" }
  ...
```

### Step 5: Define Pillars (PerformanceDimensions)

Use the template structure. These are org-wide pillars:

```
POST /api/v1/performance-dimensions
  { "name": "Financial",              "default_weight_pct": 35, "is_quantitative": true  }
  { "name": "Innovation",             "default_weight_pct": 10, "is_quantitative": false }
  { "name": "Client Value",           "default_weight_pct": 20, "is_quantitative": true  }
  { "name": "Operational Excellence", "default_weight_pct": 20, "is_quantitative": true  }
  { "name": "Talent Development",     "default_weight_pct": 10, "is_quantitative": false }
```

Then set role-specific weights via `POST /api/v1/role-dimension-weights` (e.g., IT Manager has "Operational Excellence" at 40%, not 20%).

### Step 6: Create Objective Areas (ObjectiveGroups)

```
POST /api/v1/objective-groups
  { "dimension_id": "FinancialID", "name": "Revenue Growth",       "default_weight_pct": 60 }
  { "dimension_id": "FinancialID", "name": "Cost Management",      "default_weight_pct": 40 }
  { "dimension_id": "ClientID",    "name": "Client Satisfaction",  "default_weight_pct": 50 }
  { "dimension_id": "ClientID",    "name": "Client Retention",     "default_weight_pct": 50 }
  ...
```

### Step 7: Create Standard KPIs (ObjectiveTemplates)

```
POST /api/v1/objective-templates
  { "code": "FIN-001", "title": "Operating Income vs. Budget", "dimension_id": "FinancialID",
    "kpi_type": "financial", "default_weight": 20, "completion_type": "numeric", "unit": "UGX" }
  { "code": "OPS-001", "title": "Doc-It Compliance Rate",      "dimension_id": "OpsID",
    "kpi_type": "compliance", "default_weight": 10, "completion_type": "percentage" }
  { "code": "TAL-001", "title": "Training Hours Completed",    "dimension_id": "TalentID",
    "kpi_type": "learning", "default_weight": 50, "completion_type": "numeric", "unit": "hours" }
```

### Step 8: Set Rating Bands (RewardPolicy)

```
POST /api/v1/reward-policies
  { "min_score": 121,  "max_score": 150,  "rating_label": "Outstanding",           "rating_value": 5, "color_hex": "#1b5e20" }
  { "min_score": 106,  "max_score": 120,  "rating_label": "Exceeds Expectations",  "rating_value": 4, "color_hex": "#388e3c" }
  { "min_score": 91,   "max_score": 105,  "rating_label": "Meets Expectations",    "rating_value": 3, "color_hex": "#f57f17" }
  { "min_score": 76,   "max_score": 90,   "rating_label": "Below Expectations",    "rating_value": 2, "color_hex": "#e65100" }
  { "min_score": 0,    "max_score": 75,   "rating_label": "Unsatisfactory",        "rating_value": 1, "color_hex": "#b71c1c" }
```

### Step 9: Create Appraisal Period

```
POST /api/v1/performance-cycles
  {
    "name": "2025 Annual Appraisal",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "objectives_lock_date": "2025-03-31",
    "review_frequency": "quarterly"
  }
```

### Step 10: Let Users Set Objectives

- Each user logs in and creates their objectives linked to groups and templates
- Objectives submitted → supervisor approves → objectives lock on March 31
- Quarterly updates logged throughout the year
- Year-end: self-assessment completed, appraisal meetings scheduled, scores computed

---

## 10. UI Pages to Build

### 10.1 Priority 1 — Required for Basic Operation

| Page | Route | Key Features |
|:---|:---|:---|
| **My Objectives** | `/objectives` | Grouped by Pillar → Area → KPI. Progress bar per KPI. Completion type badge. Cascade parent link. |
| **Objective Detail** | `/objectives/:id` | Target vs. actual chart. Progress update history. Evidence attachments. Cascade chain breadcrumb. |
| **My Dashboard** | `/dashboard` | Score donuts per Pillar. Overall score vs. target. Upcoming deadlines. Recent activity feed. |
| **Self-Evaluation** | `/self-evaluation` | One form per cycle. Pillar-by-pillar comments. Strengths / Development areas. Career aspirations. |
| **Manager — Team View** | `/team` | Direct reports list. Each person's score card. Team average. Who's at risk. |
| **Appraisal Summary** | `/appraisal/:id` | Side-by-side: self-score vs. system score. Pillar breakdown. Manager comments. Rating band. Acknowledgment button. |
| **Activities Panel** | (embedded in Objective Detail) | Per-KPI activity list. Status badges. Due dates. Manager verification checkboxes. Blocked flag alerts. |
| **Manager Activity Review** | `/team/:id/activities` | All activities for a direct report. Filter by status/verified. Bulk verify. Inline comments. |

### 10.2 Priority 2 — Required Before Full Deployment

| Page | Route | Key Features |
|:---|:---|:---|
| **Development Plan** | `/development` | My development goals. Status tracking. Manager feedback. |
| **Org Chart** | `/org-chart` | Visual supervisor hierarchy. Click to see person's score. |
| **Cascade View** | `/cascade` | Tree showing how my objectives link to company objectives. |
| **Calibration Dashboard** | `/calibration` | Score histograms per department. Manager comparison. Outlier flags. |
| **Admin — Import** | `/admin/import` | CSV upload for users, objectives, templates. Row-by-row validation feedback. |

### 10.3 Priority 3 — Polish & Compliance

| Page | Route | Key Features |
|:---|:---|:---|
| **PDF Export** | (button on Appraisal Summary) | Matches Mgt.xlsx layout. Employee + manager + HR signatures. |
| **Audit History** | `/audit/:entity` | Full change log for any record. Filterable by date, action, user. |
| **Setup Wizard** | `/setup` | Step-by-step first-run configuration. |
| **Analytics** | `/analytics` | Multi-year trend charts. Department comparison. Score distribution. |

---

*This guide is a living document. Update it as implementation decisions are made and edge cases discovered. The goal is for every Minet Uganda staff member to understand their performance at a glance — without needing to ask their manager.*
