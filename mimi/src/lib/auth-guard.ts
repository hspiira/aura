/**
 * Auth guard for protected routes: beforeLoad hook that redirects to /login if no token.
 * Use in route options: beforeLoad: requireAuth
 */

import { redirect } from '@tanstack/react-router'
import { isAuthenticated } from '#/stores/auth'

export function requireAuth() {
  // During SSR, localStorage is unavailable — skip the check and let the
  // client-side rehydration + re-run of beforeLoad handle it.
  if (typeof window === 'undefined') return
  if (!isAuthenticated()) {
    throw redirect({ to: '/login' })
  }
}
