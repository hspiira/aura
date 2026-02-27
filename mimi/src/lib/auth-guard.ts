/**
 * Auth guard for protected routes: beforeLoad hook that redirects to /login if no token.
 * On page reload (token lost from memory), attempts a silent refresh via httpOnly cookie
 * before giving up and redirecting.
 */

import { redirect } from '@tanstack/react-router'
import { apiPost } from '#/lib/api'
import { isAuthenticated, setAccessToken } from '#/stores/auth'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export async function requireAuth() {
  if (isAuthenticated()) return

  // Token not in memory (e.g. page reload) — try silent refresh via httpOnly cookie
  try {
    const res = await apiPost<TokenResponse>('auth/refresh', undefined, { _skipRefresh: true })
    setAccessToken(res.access_token)
    return
  } catch {
    // Refresh failed — no valid session
  }

  throw redirect({ to: '/login' })
}
