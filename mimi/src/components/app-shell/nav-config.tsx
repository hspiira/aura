/**
 * Nav items and permission gating.
 * Hide items the user's role can't access.
 */

import type { LinkProps } from '@tanstack/react-router'
import {
  BarChart3,
  Box,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  PanelLeftOpen,
  Shield,
  Target,
  Users,
} from 'lucide-react'
import type { PermissionCode } from '#/lib/permissions'
import { hasPermission } from '#/lib/permissions'
import {
  EDIT_OBJECTIVES,
  MANAGE_CYCLES,
  MANAGE_RBAC,
  MANAGE_REVIEW_SESSIONS,
  RUN_CALIBRATION,
  VIEW_USERS,
} from '#/lib/permissions'

export interface NavItem {
  label: string
  to: LinkProps['to']
  icon: React.ComponentType<{ className?: string }>
  /** If set, nav item is only shown when user has this permission. */
  permission?: PermissionCode
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Objectives', to: '/objectives', icon: Target, permission: EDIT_OBJECTIVES },
  { label: 'Cycles', to: '/cycles', icon: Calendar, permission: MANAGE_CYCLES },
  { label: 'People', to: '/people', icon: Users, permission: VIEW_USERS },
  { label: 'Reviews', to: '/reviews', icon: ClipboardList, permission: MANAGE_REVIEW_SESSIONS },
  { label: 'Calibration', to: '/calibration', icon: PanelLeftOpen, permission: RUN_CALIBRATION },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Admin', to: '/admin', icon: Shield, permission: MANAGE_RBAC },
  { label: 'My Components', to: '/my-components', icon: Box },
]

export function filterNavByPermission(
  items: NavItem[],
  permissions: string[],
): NavItem[] {
  return items.filter(
    (item) => !item.permission || hasPermission(permissions, item.permission),
  )
}
