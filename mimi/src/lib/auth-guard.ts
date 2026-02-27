/**
 * Auth guard for protected routes: beforeLoad hook that redirects to /login if no token.
 * Use in route options: beforeLoad: requireAuth
 */

import { redirect } from '@tanstack/react-router'
import { isAuthenticated } from '#/stores/auth'

export function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login' })
  }
}
