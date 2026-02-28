/**
 * Permission codes for RBAC (must match backend app.domain.permissions).
 * Used for route-level and nav item visibility gating.
 */

export const APPROVE_OBJECTIVES = 'approve_objectives'
export const EDIT_OBJECTIVES = 'edit_objectives'
export const RUN_CALIBRATION = 'run_calibration'
export const MANAGE_SUMMARIES = 'manage_summaries'
export const MANAGE_REWARD_POLICY = 'manage_reward_policy'
export const MANAGE_TEMPLATES = 'manage_templates'
export const VIEW_AUDIT_LOGS = 'view_audit_logs'
export const MANAGE_RBAC = 'manage_rbac'
export const MANAGE_BASELINES = 'manage_baselines'
export const MANAGE_NOTIFICATIONS = 'manage_notifications'
export const MANAGE_USERS = 'manage_users'
export const MANAGE_CYCLES = 'manage_cycles'
export const MANAGE_DIMENSIONS = 'manage_dimensions'
export const VIEW_USERS = 'view_users'
export const MANAGE_BEHAVIORAL = 'manage_behavioral'
export const MANAGE_REVIEW_SESSIONS = 'manage_review_sessions'

export type PermissionCode =
  | typeof APPROVE_OBJECTIVES
  | typeof EDIT_OBJECTIVES
  | typeof RUN_CALIBRATION
  | typeof MANAGE_SUMMARIES
  | typeof MANAGE_REWARD_POLICY
  | typeof MANAGE_TEMPLATES
  | typeof VIEW_AUDIT_LOGS
  | typeof MANAGE_RBAC
  | typeof MANAGE_BASELINES
  | typeof MANAGE_NOTIFICATIONS
  | typeof MANAGE_USERS
  | typeof MANAGE_CYCLES
  | typeof MANAGE_DIMENSIONS
  | typeof VIEW_USERS
  | typeof MANAGE_BEHAVIORAL
  | typeof MANAGE_REVIEW_SESSIONS

export function hasPermission(permissions: string[], code: PermissionCode): boolean {
  return permissions.includes(code)
}
