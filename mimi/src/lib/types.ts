/**
 * TypeScript types mirroring backend Pydantic response (and key request) schemas.
 * Decimal fields from the API are typed as string for precision.
 */

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string
}

// ─── Auth (JWT) ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// ─── User tokens (API keys / M2M) ────────────────────────────────────────────

export interface UserTokenCreateRequest {
  user_id: string
  description?: string | null
  expires_at?: string | null // ISO datetime
}

export interface UserTokenCreateResponse {
  token: string
}

export interface UserTokenResponse {
  id: string
  user_id: string
  description: string | null
  expires_at: string | null
  revoked: boolean
  created_at: string
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string
  role_id: string
  department_id: string
  supervisor_id: string | null
  name: string
  email: string | null
}

export interface UserCreate {
  role_id: string
  department_id: string
  supervisor_id?: string | null
  name: string
  email?: string | null
}

/** Current user + permission codes (GET /users/me). */
export interface MeResponse {
  user: UserResponse
  permissions: string[]
}

// ─── Organizations ──────────────────────────────────────────────────────────

export interface OrganizationResponse {
  id: string
  name: string
}

export interface OrganizationCreate {
  name: string
}

// ─── Departments ─────────────────────────────────────────────────────────────

export interface DepartmentResponse {
  id: string
  organization_id: string
  parent_id: string | null
  name: string
}

export interface DepartmentCreate {
  organization_id: string
  parent_id?: string | null
  name: string
}

// ─── Roles ──────────────────────────────────────────────────────────────────

export interface RoleResponse {
  id: string
  department_id: string
  name: string
  level: string | null
  is_managerial: boolean
}

export interface RoleCreate {
  department_id: string
  name: string
  level?: string | null
  is_managerial?: boolean
}

// ─── Performance cycles ──────────────────────────────────────────────────────

export interface PerformanceCycleResponse {
  id: string
  name: string
  start_date: string // date
  end_date: string
  status: string
  review_frequency: string | null
  objectives_lock_date: string | null // date
  objectives_locked_at: string | null // ISO datetime
}

export interface PerformanceCycleCreate {
  name: string
  start_date: string
  end_date: string
  status?: string
  review_frequency?: string | null
}

// ─── Performance dimensions ───────────────────────────────────────────────────

export interface PerformanceDimensionResponse {
  id: string
  name: string
  is_quantitative: boolean
  default_weight_pct: string // Decimal
}

export interface PerformanceDimensionCreate {
  name: string
  is_quantitative?: boolean
  default_weight_pct?: string
}

// ─── Role dimension weights ──────────────────────────────────────────────────

export interface RoleDimensionWeightResponse {
  id: string
  role_id: string
  dimension_id: string
  weight_pct: string
}

export interface RoleDimensionWeightCreate {
  role_id: string
  dimension_id: string
  weight_pct: string
}

// ─── Objective templates ──────────────────────────────────────────────────────

export interface ObjectiveTemplateResponse {
  id: string
  code: string
  title: string
  description: string | null
  dimension_id: string
  kpi_type: string | null
  default_weight: string
  min_target: string | null
  max_target: string | null
  requires_baseline_snapshot: boolean
  is_active: boolean
}

export interface ObjectiveTemplateCreate {
  code: string
  title: string
  description?: string | null
  dimension_id: string
  kpi_type?: string | null
  default_weight?: string
  min_target?: string | null
  max_target?: string | null
  requires_baseline_snapshot?: boolean
  is_active?: boolean
}

export interface ObjectiveTemplateUpdate {
  title?: string | null
  description?: string | null
  kpi_type?: string | null
  default_weight?: string | null
  min_target?: string | null
  max_target?: string | null
  requires_baseline_snapshot?: boolean | null
  is_active?: boolean | null
}

// ─── Objectives ───────────────────────────────────────────────────────────────

export interface ObjectiveResponse {
  id: string
  user_id: string
  performance_cycle_id: string
  dimension_id: string
  template_id: string | null
  title: string
  description: string | null
  kpi_type: string | null
  target_value: string | null
  unit_of_measure: string | null
  weight: string
  start_date: string
  end_date: string
  status: string
  approved_at: string | null
  approved_by: string | null
  locked_at: string | null
  already_locked: boolean
}

export interface ObjectiveCreate {
  user_id: string
  performance_cycle_id: string
  dimension_id: string
  template_id?: string | null
  title: string
  description?: string | null
  kpi_type?: string | null
  target_value?: string | null
  unit_of_measure?: string | null
  weight: string
  start_date: string
  end_date: string
}

export interface ObjectiveUpdateStatus {
  status: string
}

export interface ObjectiveAmend {
  target_value?: string | null
  weight?: string | null
  justification: string
}

// ─── Objective validation ────────────────────────────────────────────────────

export interface ValidateObjectiveResponse {
  valid: boolean
  errors: string[]
}

// ─── Objective updates (progress) ─────────────────────────────────────────────

export interface ObjectiveUpdateResponse {
  id: string
  objective_id: string
  actual_value: string | null
  comment: string | null
  submitted_by: string
}

export interface ObjectiveUpdateCreate {
  objective_id: string
  actual_value?: string | null
  comment?: string | null
  submitted_by: string
}

// ─── Objective evidence ──────────────────────────────────────────────────────

export interface ObjectiveEvidenceResponse {
  id: string
  objective_id: string
  description: string | null
  file_path: string | null
  uploaded_by: string
}

export interface ObjectiveEvidenceCreate {
  objective_id: string
  description?: string | null
  file_path?: string | null
  uploaded_by: string
}

// ─── Objective scores ────────────────────────────────────────────────────────

export interface ObjectiveScoreResponse {
  id: string
  objective_id: string
  achievement_percentage: string
  weighted_score: string
  calculated_at: string
  locked: boolean
}

// ─── Audit logs ───────────────────────────────────────────────────────────────

export interface AuditLogResponse {
  id: string
  entity_type: string
  entity_id: string
  action: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  changed_by: string | null
  created_at: string
}

// ─── Baseline snapshots ───────────────────────────────────────────────────────

export interface BaselineSnapshotResponse {
  id: string
  user_id: string
  performance_cycle_id: string
  template_id: string
  baseline_value: string
  snapshot_date: string
  data_source: string | null
}

export interface BaselineSnapshotCreate {
  user_id: string
  performance_cycle_id: string
  template_id: string
  baseline_value: string
  snapshot_date: string
  data_source?: string | null
}

// ─── Behavioral indicators ───────────────────────────────────────────────────

export interface BehavioralIndicatorResponse {
  id: string
  dimension_id: string
  name: string
  description: string | null
  rating_scale_min: number
  rating_scale_max: number
  is_active: boolean
}

export interface BehavioralIndicatorCreate {
  dimension_id: string
  name: string
  description?: string | null
  rating_scale_min?: number
  rating_scale_max?: number
  is_active?: boolean
}

// ─── Behavioral scores ────────────────────────────────────────────────────────

export interface BehavioralScoreResponse {
  id: string
  user_id: string
  performance_cycle_id: string
  indicator_id: string
  rating: number
  manager_comment: string | null
}

export interface BehavioralScoreCreate {
  user_id: string
  performance_cycle_id: string
  indicator_id: string
  rating: number
  manager_comment?: string | null
}

// ─── Performance summaries ────────────────────────────────────────────────────

export interface PerformanceSummaryResponse {
  id: string
  user_id: string
  performance_cycle_id: string
  quantitative_score: string | null
  behavioral_score: string | null
  final_weighted_score: string | null
  final_rating_band: string | null
  manager_comment: string | null
  employee_comment: string | null
  hr_approved: boolean
}

export interface ComputeSummaryRequest {
  user_id: string
  performance_cycle_id: string
}

export interface PerformanceSummaryUpdate {
  final_rating_band?: string | null
  manager_comment?: string | null
  employee_comment?: string | null
  hr_approved?: boolean | null
}

// ─── Review sessions ──────────────────────────────────────────────────────────

export type ReviewSessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type ReviewSessionType = 'mid_year' | 'final'

export interface ReviewSessionResponse {
  id: string
  user_id: string
  performance_cycle_id: string
  reviewer_id: string
  session_type: ReviewSessionType
  status: ReviewSessionStatus
  scheduled_at: string | null
  completed_at: string | null
}

export interface ReviewSessionCreate {
  user_id: string
  performance_cycle_id: string
  reviewer_id: string
  session_type: ReviewSessionType
  status?: ReviewSessionStatus
  scheduled_at?: string | null
}

// ─── Calibration sessions ─────────────────────────────────────────────────────

export interface CalibrationSessionResponse {
  id: string
  performance_cycle_id: string
  department_id: string
  conducted_by_id: string
  conducted_at: string
  notes: string | null
}

export interface CalibrationSessionCreate {
  performance_cycle_id: string
  department_id: string
  conducted_by_id: string
  conducted_at: string
  notes?: string | null
}

// ─── Reward policies ──────────────────────────────────────────────────────────

export interface RewardPolicyResponse {
  id: string
  min_score: string
  max_score: string
  reward_type: string
  reward_value: string
}

export interface RewardPolicyCreate {
  min_score: string
  max_score: string
  reward_type: string
  reward_value: string
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export interface PermissionResponse {
  id: string
  code: string
  name: string
  description: string | null
}

export interface PermissionCreate {
  code: string
  name: string
  description?: string | null
}

// ─── Role permissions ─────────────────────────────────────────────────────────

export interface RolePermissionResponse {
  id: string
  role_id: string
  permission_id: string
}

export interface RolePermissionCreate {
  role_id: string
  permission_id: string
}

// ─── Notification rules ───────────────────────────────────────────────────────

export interface NotificationRuleResponse {
  id: string
  event_type: string
  recipient_role_id: string
  channel: string
  template_body: string | null
}

export interface NotificationRuleCreate {
  event_type: string
  recipient_role_id: string
  channel: string
  template_body?: string | null
}

// ─── Notification logs ─────────────────────────────────────────────────────────

export interface NotificationLogResponse {
  id: string
  event_type: string
  recipient_id: string | null
  channel: string
  sent_at: string
  status: string
  error_message: string | null
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export interface FactPerformanceSummaryResponse {
  id: string
  user_id: string
  department_id: string
  role_id: string
  performance_cycle_id: string
  cycle_year: number
  quantitative_score: string | null
  behavioral_score: string | null
  final_score: string | null
  rating_band: string | null
  etl_at: string
}

export interface DistributionBucket {
  label: string
  count: number
  percentage: number
}

export interface VarianceItem {
  department_id: string
  mean_score: number
  std_dev: number
  is_outlier: boolean
}
