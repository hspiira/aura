/**
 * React Query query/mutation factories for every API endpoint group.
 * Use with useQuery / useMutation; invalidate via queryKeys.
 */

import { queryOptions } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPatch, apiPost } from '#/lib/api'
import type {
  AuditLogResponse,
  BaselineSnapshotCreate,
  BaselineSnapshotResponse,
  BehavioralIndicatorCreate,
  BehavioralIndicatorResponse,
  BehavioralScoreCreate,
  BehavioralScoreResponse,
  CalibrationSessionCreate,
  CalibrationSessionResponse,
  DepartmentCreate,
  DepartmentResponse,
  DistributionBucket,
  FactPerformanceSummaryResponse,
  HealthResponse,
  MeResponse,
  NotificationLogResponse,
  NotificationRuleCreate,
  NotificationRuleResponse,
  NotificationRuleUpdate,
  ObjectiveAmend,
  ObjectiveCreate,
  ObjectiveEvidenceCreate,
  ObjectiveEvidenceResponse,
  ObjectiveResponse,
  ObjectiveScoreResponse,
  ObjectiveTemplateCreate,
  ObjectiveTemplateResponse,
  ObjectiveTemplateUpdate,
  ObjectiveUpdateCreate,
  ObjectiveUpdateResponse,
  ObjectiveUpdateStatus,
  OrganizationCreate,
  OrganizationResponse,
  PageResponse,
  PerformanceCycleCreate,
  PerformanceCycleResponse,
  PerformanceCycleUpdate,
  PerformanceDimensionCreate,
  PerformanceDimensionResponse,
  PerformanceDimensionUpdate,
  PerformanceSummaryResponse,
  PerformanceSummaryUpdate,
  PermissionCreate,
  PermissionResponse,
  ReviewSessionCreate,
  ReviewSessionResponse,
  ReviewSessionStatus,
  ReviewSessionUpdate,
  RewardPolicyCreate,
  RewardPolicyResponse,
  RewardPolicyUpdate,
  RoleCreate,
  RoleDimensionWeightCreate,
  RoleDimensionWeightResponse,
  RoleDimensionWeightUpdate,
  RolePermissionCreate,
  RolePermissionResponse,
  RoleResponse,
  RoleUpdate,
  UserCreate,
  UserResponse,
  UserUpdate,
  UserTokenCreateRequest,
  UserTokenCreateResponse,
  UserTokenResponse,
  ValidateObjectiveResponse,
  VarianceItem,
} from '#/lib/types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  health: ['health'] as const,
  analytics: {
    all: ['analytics'] as const,
    factSummaries: (params?: { cycle_year?: number; department_id?: string }) =>
      ['analytics', 'fact-summaries', params] as const,
    refreshStatus: ['analytics', 'refresh', 'status'] as const,
  },
  calibrationAnalytics: {
    distribution: (cycleId: string, departmentId?: string) =>
      ['analytics', 'calibration', 'distribution', cycleId, departmentId] as const,
    variance: (cycleId: string, departmentId?: string) =>
      ['analytics', 'calibration', 'variance', cycleId, departmentId] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
  },
  departments: {
    all: ['departments'] as const,
    detail: (id: string) => ['departments', id] as const,
  },
  roles: {
    all: ['roles'] as const,
    detail: (id: string) => ['roles', id] as const,
  },
  users: {
    all: (params?: { limit?: number; offset?: number }) => ['users', params] as const,
    detail: (id: string) => ['users', id] as const,
    me: ['users', 'me'] as const,
  },
  performanceCycles: {
    all: ['performance-cycles'] as const,
    detail: (id: string) => ['performance-cycles', id] as const,
  },
  performanceDimensions: {
    all: ['performance-dimensions'] as const,
    detail: (id: string) => ['performance-dimensions', id] as const,
  },
  roleDimensionWeights: {
    all: (params?: { role_id?: string }) =>
      ['role-dimension-weights', params] as const,
    detail: (id: string) => ['role-dimension-weights', id] as const,
  },
  objectiveTemplates: {
    all: ['objective-templates'] as const,
    detail: (id: string) => ['objective-templates', id] as const,
  },
  objectives: {
    all: (params?: {
      limit?: number
      offset?: number
      user_id?: string
      performance_cycle_id?: string
      status?: string
      dimension_id?: string
    }) => ['objectives', params] as const,
    detail: (id: string) => ['objectives', id] as const,
  },
  objectiveUpdates: {
    all: (params?: {
      limit?: number
      offset?: number
      objective_id?: string
    }) => ['objective-updates', params] as const,
    detail: (id: string) => ['objective-updates', id] as const,
  },
  objectiveEvidence: {
    all: ['objective-evidence'] as const,
    byObjective: (objectiveId: string) => ['objective-evidence', 'by-objective', objectiveId] as const,
    detail: (id: string) => ['objective-evidence', id] as const,
  },
  objectiveScores: {
    byObjective: (objectiveId: string) => ['objective-scores', 'by-objective', objectiveId] as const,
    detail: (id: string) => ['objective-scores', id] as const,
  },
  auditLogs: {
    all: (params?: { limit?: number; offset?: number }) => ['audit-logs', params] as const,
    byEntity: (entityType: string, entityId: string, params?: { limit?: number; offset?: number }) =>
      ['audit-logs', 'entity', entityType, entityId, params] as const,
    recent: (entityType: string, limit?: number) =>
      ['audit-logs', 'recent', entityType, limit] as const,
  },
  baselineSnapshots: {
    all: ['baseline-snapshots'] as const,
    detail: (id: string) => ['baseline-snapshots', id] as const,
  },
  behavioralIndicators: {
    all: ['behavioral-indicators'] as const,
    detail: (id: string) => ['behavioral-indicators', id] as const,
  },
  behavioralScores: {
    all: (params?: { user_id?: string; performance_cycle_id?: string }) =>
      ['behavioral-scores', params] as const,
    detail: (id: string) => ['behavioral-scores', id] as const,
  },
  performanceSummaries: {
    all: (params?: { user_id?: string; performance_cycle_id?: string }) =>
      ['performance-summaries', params] as const,
    byUserCycle: (userId: string, cycleId: string) =>
      ['performance-summaries', 'by-user-cycle', userId, cycleId] as const,
    detail: (id: string) => ['performance-summaries', id] as const,
  },
  reviewSessions: {
    all: (params?: { user_id?: string; performance_cycle_id?: string }) =>
      ['review-sessions', params] as const,
    detail: (id: string) => ['review-sessions', id] as const,
  },
  calibrationSessions: {
    all: (params?: { performance_cycle_id?: string; department_id?: string }) =>
      ['calibration-sessions', params] as const,
    detail: (id: string) => ['calibration-sessions', id] as const,
  },
  rewardPolicies: {
    all: ['reward-policies'] as const,
    band: ['reward-policies', 'band'] as const,
    detail: (id: string) => ['reward-policies', id] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    detail: (id: string) => ['permissions', id] as const,
  },
  rolePermissions: {
    all: (params?: { role_id?: string }) => ['role-permissions', params] as const,
    detail: (id: string) => ['role-permissions', id] as const,
  },
  notificationRules: {
    all: ['notification-rules'] as const,
    detail: (id: string) => ['notification-rules', id] as const,
  },
  notificationLogs: {
    all: (params?: { limit?: number; offset?: number }) => ['notification-logs', params] as const,
  },
  userTokens: {
    all: (params?: { user_id?: string; limit?: number }) =>
      ['user-tokens', params] as const,
  },
}

// ─── Health ──────────────────────────────────────────────────────────────────

export function healthQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.health,
    queryFn: () => apiGet<HealthResponse>('health'),
  })
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function analyticsFactSummariesQueryOptions(params?: {
  cycle_year?: number
  department_id?: string
  limit?: number
}) {
  const search = new URLSearchParams()
  if (params?.cycle_year != null) search.set('cycle_year', String(params.cycle_year))
  if (params?.department_id) search.set('department_id', params.department_id)
  if (params?.limit != null) search.set('limit', String(params.limit))
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.analytics.factSummaries(params),
    queryFn: () =>
      apiGet<FactPerformanceSummaryResponse[]>(`analytics/fact-performance-summaries${qs ? `?${qs}` : ''}`),
  })
}

export function analyticsRefreshStatusQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.analytics.refreshStatus,
    queryFn: () => apiGet<{ running: boolean; last_started_at?: string; last_finished_at?: string; last_upserted?: number; last_error?: string }>(
      'analytics/refresh/status',
    ),
  })
}

export function calibrationDistributionQueryOptions(cycleId: string, departmentId?: string) {
  const search = new URLSearchParams({ cycle_id: cycleId })
  if (departmentId) search.set('department_id', departmentId)
  return queryOptions({
    queryKey: queryKeys.calibrationAnalytics.distribution(cycleId, departmentId),
    queryFn: () => apiGet<DistributionBucket[]>(`analytics/calibration/distribution?${search}`),
    enabled: !!cycleId,
  })
}

export function calibrationVarianceQueryOptions(cycleId: string, departmentId?: string) {
  const search = new URLSearchParams({ cycle_id: cycleId })
  if (departmentId) search.set('department_id', departmentId)
  return queryOptions({
    queryKey: queryKeys.calibrationAnalytics.variance(cycleId, departmentId),
    queryFn: () => apiGet<VarianceItem[]>(`analytics/calibration/variance?${search}`),
    enabled: !!cycleId,
  })
}

// ─── Organizations ───────────────────────────────────────────────────────────

export function organizationsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.organizations.all,
    queryFn: () => apiGet<OrganizationResponse[]>('organizations'),
  })
}

export function organizationDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: () => apiGet<OrganizationResponse>(`organizations/${id}`),
    enabled: !!id,
  })
}

// ─── Departments ──────────────────────────────────────────────────────────────

export function departmentsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiGet<DepartmentResponse[]>('departments'),
  })
}

export function departmentDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.departments.detail(id),
    queryFn: () => apiGet<DepartmentResponse>(`departments/${id}`),
    enabled: !!id,
  })
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export function rolesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.roles.all,
    queryFn: () => apiGet<RoleResponse[]>('roles'),
  })
}

export function roleDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => apiGet<RoleResponse>(`roles/${id}`),
    enabled: !!id,
  })
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function usersQueryOptions(params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.users.all(params),
    queryFn: () => apiGet<PageResponse<UserResponse>>(`users${qs ? `?${qs}` : ''}`),
  })
}

export function userDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiGet<UserResponse>(`users/${id}`),
    enabled: !!id,
  })
}

export function meQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.users.me,
    queryFn: () => apiGet<MeResponse>('users/me'),
  })
}

export function userTokensQueryOptions(params?: { user_id?: string; limit?: number }) {
  const search = new URLSearchParams()
  if (params?.user_id) search.set('user_id', params.user_id)
  if (params?.limit != null) search.set('limit', String(params.limit))
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.userTokens.all(params),
    queryFn: () =>
      apiGet<UserTokenResponse[]>(`user-tokens${qs ? `?${qs}` : ''}`),
  })
}

// ─── Performance cycles ───────────────────────────────────────────────────────

export function performanceCyclesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.performanceCycles.all,
    queryFn: () => apiGet<PerformanceCycleResponse[]>('performance-cycles'),
  })
}

export function performanceCycleDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.performanceCycles.detail(id),
    queryFn: () => apiGet<PerformanceCycleResponse>(`performance-cycles/${id}`),
    enabled: !!id,
  })
}

// ─── Performance dimensions ───────────────────────────────────────────────────

export function performanceDimensionsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.performanceDimensions.all,
    queryFn: () => apiGet<PerformanceDimensionResponse[]>('performance-dimensions'),
  })
}

export function performanceDimensionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.performanceDimensions.detail(id),
    queryFn: () => apiGet<PerformanceDimensionResponse>(`performance-dimensions/${id}`),
    enabled: !!id,
  })
}

// ─── Role dimension weights ───────────────────────────────────────────────────

export function roleDimensionWeightsQueryOptions(params?: { role_id?: string }) {
  const search = new URLSearchParams()
  if (params?.role_id) search.set('role_id', params.role_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.roleDimensionWeights.all(params),
    queryFn: () =>
      apiGet<RoleDimensionWeightResponse[]>(
        `role-dimension-weights${qs ? `?${qs}` : ''}`,
      ),
  })
}

export function roleDimensionWeightDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.roleDimensionWeights.detail(id),
    queryFn: () => apiGet<RoleDimensionWeightResponse>(`role-dimension-weights/${id}`),
    enabled: !!id,
  })
}

// ─── Objective templates ──────────────────────────────────────────────────────

export function objectiveTemplatesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.objectiveTemplates.all,
    queryFn: () => apiGet<ObjectiveTemplateResponse[]>('objective-templates'),
  })
}

export function objectiveTemplateDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.objectiveTemplates.detail(id),
    queryFn: () => apiGet<ObjectiveTemplateResponse>(`objective-templates/${id}`),
    enabled: !!id,
  })
}

// ─── Objectives ───────────────────────────────────────────────────────────────

export function objectivesQueryOptions(params?: {
  limit?: number
  offset?: number
  user_id?: string
  performance_cycle_id?: string
  status?: string
  dimension_id?: string
}) {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  if (params?.user_id) search.set('user_id', params.user_id)
  if (params?.performance_cycle_id) search.set('performance_cycle_id', params.performance_cycle_id)
  if (params?.status) search.set('status', params.status)
  if (params?.dimension_id) search.set('dimension_id', params.dimension_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.objectives.all(params),
    queryFn: () => apiGet<PageResponse<ObjectiveResponse>>(`objectives${qs ? `?${qs}` : ''}`),
  })
}

export function objectiveDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.objectives.detail(id),
    queryFn: () => apiGet<ObjectiveResponse>(`objectives/${id}`),
    enabled: !!id,
  })
}

// ─── Objective updates ───────────────────────────────────────────────────────

export function objectiveUpdatesQueryOptions(params?: {
  limit?: number
  offset?: number
  objective_id?: string
}) {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  if (params?.objective_id) search.set('objective_id', params.objective_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.objectiveUpdates.all(params),
    queryFn: () => apiGet<PageResponse<ObjectiveUpdateResponse>>(`objective-updates${qs ? `?${qs}` : ''}`),
  })
}

export function objectiveUpdateDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.objectiveUpdates.detail(id),
    queryFn: () => apiGet<ObjectiveUpdateResponse>(`objective-updates/${id}`),
    enabled: !!id,
  })
}

// ─── Objective evidence ───────────────────────────────────────────────────────

export function objectiveEvidenceQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.objectiveEvidence.all,
    queryFn: () => apiGet<ObjectiveEvidenceResponse[]>('objective-evidence'),
  })
}

export function objectiveEvidenceByObjectiveQueryOptions(objectiveId: string) {
  const search = new URLSearchParams({ objective_id: objectiveId })
  return queryOptions({
    queryKey: queryKeys.objectiveEvidence.byObjective(objectiveId),
    queryFn: () => apiGet<ObjectiveEvidenceResponse[]>(`objective-evidence?${search}`),
    enabled: !!objectiveId,
  })
}

export function objectiveEvidenceDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.objectiveEvidence.detail(id),
    queryFn: () => apiGet<ObjectiveEvidenceResponse>(`objective-evidence/${id}`),
    enabled: !!id,
  })
}

// ─── Objective scores ────────────────────────────────────────────────────────

export function objectiveScoreByObjectiveQueryOptions(objectiveId: string) {
  return queryOptions({
    queryKey: queryKeys.objectiveScores.byObjective(objectiveId),
    queryFn: () => apiGet<ObjectiveScoreResponse>(`objective-scores/by-objective/${objectiveId}`),
    enabled: !!objectiveId,
  })
}

export function objectiveScoreDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.objectiveScores.detail(id),
    queryFn: () => apiGet<ObjectiveScoreResponse>(`objective-scores/${id}`),
    enabled: !!id,
  })
}

// ─── Audit logs ───────────────────────────────────────────────────────────────

export function auditLogsQueryOptions(params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.auditLogs.all(params),
    queryFn: () => apiGet<PageResponse<AuditLogResponse>>(`audit-logs${qs ? `?${qs}` : ''}`),
  })
}

export function auditLogsRecentQueryOptions(entityType: string, limit = 20) {
  const search = new URLSearchParams({ entity_type: entityType, limit: String(limit) })
  return queryOptions({
    queryKey: queryKeys.auditLogs.recent(entityType, limit),
    queryFn: () =>
      apiGet<AuditLogResponse[]>(`audit-logs/recent?${search}`),
    enabled: !!entityType,
  })
}

export function auditLogsForEntityQueryOptions(
  entityType: string,
  entityId: string,
  params?: { limit?: number; offset?: number },
) {
  const search = new URLSearchParams({ entity_type: entityType, entity_id: entityId })
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  return queryOptions({
    queryKey: queryKeys.auditLogs.byEntity(entityType, entityId, params),
    queryFn: () => apiGet<PageResponse<AuditLogResponse>>(`audit-logs?${search}`),
    enabled: !!entityType && !!entityId,
  })
}

// ─── Baseline snapshots ────────────────────────────────────────────────────────

export function baselineSnapshotsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.baselineSnapshots.all,
    queryFn: () => apiGet<BaselineSnapshotResponse[]>('baseline-snapshots'),
  })
}

export function baselineSnapshotDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.baselineSnapshots.detail(id),
    queryFn: () => apiGet<BaselineSnapshotResponse>(`baseline-snapshots/${id}`),
    enabled: !!id,
  })
}

// ─── Behavioral indicators ───────────────────────────────────────────────────

export function behavioralIndicatorsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.behavioralIndicators.all,
    queryFn: () => apiGet<BehavioralIndicatorResponse[]>('behavioral-indicators'),
  })
}

export function behavioralIndicatorDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.behavioralIndicators.detail(id),
    queryFn: () => apiGet<BehavioralIndicatorResponse>(`behavioral-indicators/${id}`),
    enabled: !!id,
  })
}

// ─── Behavioral scores ───────────────────────────────────────────────────────

export function behavioralScoresQueryOptions(params?: {
  user_id?: string
  performance_cycle_id?: string
}) {
  const search = new URLSearchParams()
  if (params?.user_id) search.set('user_id', params.user_id)
  if (params?.performance_cycle_id) search.set('performance_cycle_id', params.performance_cycle_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.behavioralScores.all(params),
    queryFn: () => apiGet<BehavioralScoreResponse[]>(`behavioral-scores${qs ? `?${qs}` : ''}`),
  })
}

export function behavioralScoreDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.behavioralScores.detail(id),
    queryFn: () => apiGet<BehavioralScoreResponse>(`behavioral-scores/${id}`),
    enabled: !!id,
  })
}

// ─── Performance summaries ───────────────────────────────────────────────────

export function performanceSummariesQueryOptions(params?: {
  user_id?: string
  performance_cycle_id?: string
}) {
  const search = new URLSearchParams()
  if (params?.user_id) search.set('user_id', params.user_id)
  if (params?.performance_cycle_id) search.set('performance_cycle_id', params.performance_cycle_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.performanceSummaries.all(params),
    queryFn: () => apiGet<PerformanceSummaryResponse[]>(`performance-summaries${qs ? `?${qs}` : ''}`),
  })
}

export function performanceSummaryByUserCycleQueryOptions(userId: string, cycleId: string) {
  const search = new URLSearchParams({ user_id: userId, performance_cycle_id: cycleId })
  return queryOptions({
    queryKey: queryKeys.performanceSummaries.byUserCycle(userId, cycleId),
    queryFn: async (): Promise<PerformanceSummaryResponse | null> => {
      try {
        return await apiGet<PerformanceSummaryResponse>(
          `performance-summaries/by-user-cycle?${search}`,
        )
      } catch (err) {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
          return null
        }
        throw err
      }
    },
    enabled: !!userId && !!cycleId,
  })
}

export function performanceSummaryDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.performanceSummaries.detail(id),
    queryFn: () => apiGet<PerformanceSummaryResponse>(`performance-summaries/${id}`),
    enabled: !!id,
  })
}

// ─── Review sessions ──────────────────────────────────────────────────────────

export function reviewSessionsQueryOptions(params?: {
  user_id?: string
  performance_cycle_id?: string
}) {
  const search = new URLSearchParams()
  if (params?.user_id) search.set('user_id', params.user_id)
  if (params?.performance_cycle_id) search.set('performance_cycle_id', params.performance_cycle_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.reviewSessions.all(params),
    queryFn: () => apiGet<ReviewSessionResponse[]>(`review-sessions${qs ? `?${qs}` : ''}`),
  })
}

export function reviewSessionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.reviewSessions.detail(id),
    queryFn: () => apiGet<ReviewSessionResponse>(`review-sessions/${id}`),
    enabled: !!id,
  })
}

// ─── Calibration sessions ──────────────────────────────────────────────────────

export function calibrationSessionsQueryOptions(params?: {
  performance_cycle_id?: string
  department_id?: string
}) {
  const search = new URLSearchParams()
  if (params?.performance_cycle_id) search.set('performance_cycle_id', params.performance_cycle_id)
  if (params?.department_id) search.set('department_id', params.department_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.calibrationSessions.all(params),
    queryFn: () => apiGet<CalibrationSessionResponse[]>(`calibration-sessions${qs ? `?${qs}` : ''}`),
    enabled: !!params?.performance_cycle_id,
  })
}

export function calibrationSessionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.calibrationSessions.detail(id),
    queryFn: () => apiGet<CalibrationSessionResponse>(`calibration-sessions/${id}`),
    enabled: !!id,
  })
}

// ─── Reward policies ──────────────────────────────────────────────────────────

export function rewardPoliciesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.rewardPolicies.all,
    queryFn: () => apiGet<RewardPolicyResponse[]>('reward-policies'),
  })
}

export function rewardPolicyBandQueryOptions(score: string) {
  return queryOptions({
    queryKey: [...queryKeys.rewardPolicies.band, score] as const,
    queryFn: () => apiGet<RewardPolicyResponse>(`reward-policies/band?score=${encodeURIComponent(score)}`),
    enabled: !!score,
  })
}

export function rewardPolicyDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.rewardPolicies.detail(id),
    queryFn: () => apiGet<RewardPolicyResponse>(`reward-policies/${id}`),
    enabled: !!id,
  })
}

// ─── Permissions ───────────────────────────────────────────────────────────────

export function permissionsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.permissions.all,
    queryFn: () => apiGet<PermissionResponse[]>('permissions'),
  })
}

export function permissionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.permissions.detail(id),
    queryFn: () => apiGet<PermissionResponse>(`permissions/${id}`),
    enabled: !!id,
  })
}

// ─── Role permissions ─────────────────────────────────────────────────────────

export function rolePermissionsQueryOptions(params?: { role_id?: string }) {
  const search = new URLSearchParams()
  if (params?.role_id) search.set('role_id', params.role_id)
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.rolePermissions.all(params),
    queryFn: () => apiGet<RolePermissionResponse[]>(`role-permissions${qs ? `?${qs}` : ''}`),
  })
}

export function rolePermissionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.rolePermissions.detail(id),
    queryFn: () => apiGet<RolePermissionResponse>(`role-permissions/${id}`),
    enabled: !!id,
  })
}

// ─── Notification rules ────────────────────────────────────────────────────────

export function notificationRulesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.notificationRules.all,
    queryFn: () => apiGet<NotificationRuleResponse[]>('notification-rules'),
  })
}

export function notificationRuleDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.notificationRules.detail(id),
    queryFn: () => apiGet<NotificationRuleResponse>(`notification-rules/${id}`),
    enabled: !!id,
  })
}

// ─── Notification logs ─────────────────────────────────────────────────────────

export function notificationLogsQueryOptions(params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  const qs = search.toString()
  return queryOptions({
    queryKey: queryKeys.notificationLogs.all(params),
    queryFn: () => apiGet<PageResponse<NotificationLogResponse>>(`notification-logs${qs ? `?${qs}` : ''}`),
  })
}

// ─── Mutation option factories (for useMutation; invalidation is caller's responsibility) ───

export const mutations = {
  organizations: {
    create: (body: OrganizationCreate) => apiPost<OrganizationResponse, OrganizationCreate>('organizations', body),
    createOptions: () => ({ mutationKey: queryKeys.organizations.all } as const),
  },
  departments: {
    create: (body: DepartmentCreate) => apiPost<DepartmentResponse, DepartmentCreate>('departments', body),
    createOptions: () => ({ mutationKey: queryKeys.departments.all } as const),
  },
  roles: {
    create: (body: RoleCreate) => apiPost<RoleResponse, RoleCreate>('roles', body),
    update: (id: string, body: RoleUpdate) =>
      apiPatch<RoleResponse, RoleUpdate>(`roles/${id}`, body),
    createOptions: () => ({ mutationKey: queryKeys.roles.all } as const),
  },
  users: {
    create: (body: UserCreate) => apiPost<UserResponse, UserCreate>('users', body),
    update: (id: string, body: UserUpdate) =>
      apiPatch<UserResponse, UserUpdate>(`users/${id}`, body),
    createOptions: () => ({ mutationKey: queryKeys.users.all() } as const),
  },
  performanceCycles: {
    create: (body: PerformanceCycleCreate) =>
      apiPost<PerformanceCycleResponse, PerformanceCycleCreate>('performance-cycles', body),
    update: (id: string, body: PerformanceCycleUpdate) =>
      apiPatch<PerformanceCycleResponse, PerformanceCycleUpdate>(
        `performance-cycles/${id}`,
        body,
      ),
    lockObjectives: (id: string) =>
      apiPost<PerformanceCycleResponse>(`performance-cycles/${id}/lock-objectives`),
    createOptions: () => ({ mutationKey: queryKeys.performanceCycles.all } as const),
  },
  performanceDimensions: {
    create: (body: PerformanceDimensionCreate) =>
      apiPost<PerformanceDimensionResponse, PerformanceDimensionCreate>('performance-dimensions', body),
    update: (id: string, body: PerformanceDimensionUpdate) =>
      apiPatch<PerformanceDimensionResponse, PerformanceDimensionUpdate>(
        `performance-dimensions/${id}`,
        body,
      ),
    createOptions: () => ({ mutationKey: queryKeys.performanceDimensions.all } as const),
  },
  roleDimensionWeights: {
    create: (body: RoleDimensionWeightCreate) =>
      apiPost<RoleDimensionWeightResponse, RoleDimensionWeightCreate>(
        'role-dimension-weights',
        body,
      ),
    update: (id: string, body: RoleDimensionWeightUpdate) =>
      apiPatch<RoleDimensionWeightResponse, RoleDimensionWeightUpdate>(
        `role-dimension-weights/${id}`,
        body,
      ),
    delete: (id: string) => apiDelete(`role-dimension-weights/${id}`),
    createOptions: () => ({
      mutationKey: queryKeys.roleDimensionWeights.all(),
    } as const),
  },
  objectiveTemplates: {
    create: (body: ObjectiveTemplateCreate) =>
      apiPost<ObjectiveTemplateResponse, ObjectiveTemplateCreate>('objective-templates', body),
    update: (id: string, body: ObjectiveTemplateUpdate) =>
      apiPatch<ObjectiveTemplateResponse, ObjectiveTemplateUpdate>(`objective-templates/${id}`, body),
    delete: (id: string) => apiDelete(`objective-templates/${id}`),
    createOptions: () => ({ mutationKey: queryKeys.objectiveTemplates.all } as const),
  },
  objectives: {
    create: (body: ObjectiveCreate) => apiPost<ObjectiveResponse, ObjectiveCreate>('objectives', body),
    amend: (id: string, body: ObjectiveAmend) =>
      apiPatch<ObjectiveResponse, ObjectiveAmend>(`objectives/${id}/amend`, body),
    updateStatus: (id: string, body: ObjectiveUpdateStatus) =>
      apiPatch<ObjectiveResponse, ObjectiveUpdateStatus>(`objectives/${id}/status`, body),
    calculateScore: (id: string) => apiPost<ObjectiveScoreResponse>(`objectives/${id}/calculate-score`),
    lock: (id: string) => apiPost<ObjectiveResponse>(`objectives/${id}/lock`),
    validate: (body: { objective_id: string }) =>
      apiPost<ValidateObjectiveResponse>('objectives/validate', body),
    createOptions: () => ({ mutationKey: queryKeys.objectives.all() } as const),
  },
  objectiveUpdates: {
    create: (body: ObjectiveUpdateCreate) =>
      apiPost<ObjectiveUpdateResponse, ObjectiveUpdateCreate>('objective-updates', body),
    createOptions: () => ({ mutationKey: queryKeys.objectiveUpdates.all() } as const),
  },
  objectiveEvidence: {
    create: (body: ObjectiveEvidenceCreate) =>
      apiPost<ObjectiveEvidenceResponse, ObjectiveEvidenceCreate>('objective-evidence', body),
    createOptions: () => ({ mutationKey: queryKeys.objectiveEvidence.all } as const),
  },
  baselineSnapshots: {
    create: (body: BaselineSnapshotCreate) =>
      apiPost<BaselineSnapshotResponse, BaselineSnapshotCreate>('baseline-snapshots', body),
    createOptions: () => ({ mutationKey: queryKeys.baselineSnapshots.all } as const),
  },
  behavioralIndicators: {
    create: (body: BehavioralIndicatorCreate) =>
      apiPost<BehavioralIndicatorResponse, BehavioralIndicatorCreate>('behavioral-indicators', body),
    createOptions: () => ({ mutationKey: queryKeys.behavioralIndicators.all } as const),
  },
  behavioralScores: {
    create: (body: BehavioralScoreCreate) =>
      apiPost<BehavioralScoreResponse, BehavioralScoreCreate>('behavioral-scores', body),
    createOptions: () => ({ mutationKey: queryKeys.behavioralScores.all() } as const),
  },
  performanceSummaries: {
    compute: (body: { user_id: string; performance_cycle_id: string }) =>
      apiPost<PerformanceSummaryResponse>('performance-summaries/compute', body),
    update: (id: string, body: PerformanceSummaryUpdate) =>
      apiPatch<PerformanceSummaryResponse, PerformanceSummaryUpdate>(`performance-summaries/${id}`, body),
    createOptions: () => ({ mutationKey: queryKeys.performanceSummaries.all() } as const),
  },
  reviewSessions: {
    create: (body: ReviewSessionCreate) =>
      apiPost<ReviewSessionResponse, ReviewSessionCreate>('review-sessions', body),
    update: (id: string, body: ReviewSessionUpdate) =>
      apiPatch<ReviewSessionResponse, ReviewSessionUpdate>(`review-sessions/${id}`, body),
    updateStatus: (id: string, status: ReviewSessionStatus) =>
      apiPatch<ReviewSessionResponse, { status: ReviewSessionStatus }>(
        `review-sessions/${id}`,
        { status },
      ),
    createOptions: () => ({ mutationKey: queryKeys.reviewSessions.all() } as const),
  },
  calibrationSessions: {
    create: (body: CalibrationSessionCreate) =>
      apiPost<CalibrationSessionResponse, CalibrationSessionCreate>('calibration-sessions', body),
    createOptions: () => ({ mutationKey: queryKeys.calibrationSessions.all() } as const),
  },
  rewardPolicies: {
    create: (body: RewardPolicyCreate) =>
      apiPost<RewardPolicyResponse, RewardPolicyCreate>('reward-policies', body),
    update: (id: string, body: RewardPolicyUpdate) =>
      apiPatch<RewardPolicyResponse, RewardPolicyUpdate>(
        `reward-policies/${id}`,
        body,
      ),
    delete: (id: string) => apiDelete(`reward-policies/${id}`),
    createOptions: () => ({ mutationKey: queryKeys.rewardPolicies.all } as const),
  },
  permissions: {
    create: (body: PermissionCreate) =>
      apiPost<PermissionResponse, PermissionCreate>('permissions', body),
    createOptions: () => ({ mutationKey: queryKeys.permissions.all } as const),
  },
  rolePermissions: {
    create: (body: RolePermissionCreate) =>
      apiPost<RolePermissionResponse, RolePermissionCreate>('role-permissions', body),
    delete: (id: string) => apiDelete(`role-permissions/${id}`),
    createOptions: () => ({ mutationKey: queryKeys.rolePermissions.all() } as const),
  },
  notificationRules: {
    create: (body: NotificationRuleCreate) =>
      apiPost<NotificationRuleResponse, NotificationRuleCreate>(
        'notification-rules',
        body,
      ),
    update: (id: string, body: NotificationRuleUpdate) =>
      apiPatch<NotificationRuleResponse, NotificationRuleUpdate>(
        `notification-rules/${id}`,
        body,
      ),
    delete: (id: string) => apiDelete(`notification-rules/${id}`),
    createOptions: () => ({ mutationKey: queryKeys.notificationRules.all } as const),
  },
  userTokens: {
    create: (body: UserTokenCreateRequest) =>
      apiPost<UserTokenCreateResponse, UserTokenCreateRequest>('user-tokens', body),
    revoke: (id: string) => apiPost<void>(`user-tokens/${id}/revoke`),
    delete: (id: string) => apiDelete(`user-tokens/${id}`),
  },
  auth: {
    login: (body: { email: string; password: string }) =>
      apiPost<{ access_token: string; token_type: string; expires_in: number }>('auth/login', body),
    logout: () => apiPost<void>('auth/logout'),
  },
  analytics: {
    refresh: () => apiPost<unknown>('analytics/refresh'),
    refreshOptions: () => ({ mutationKey: queryKeys.analytics.refreshStatus } as const),
  },
}
