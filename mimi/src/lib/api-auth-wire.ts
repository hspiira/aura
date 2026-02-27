/**
 * Wire the API client to the auth store: token getter, refresh, and 401 handler.
 * Call once at app startup (e.g. from root layout or main).
 */

import { setApiTokenGetter, setApiUnauthorizedHandler, setApiRefreshFn, apiPost } from '#/lib/api'
import { clearAuth, getToken, setAccessToken } from '#/stores/auth'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export function wireApiAuth() {
  setApiTokenGetter(getToken)

  setApiRefreshFn(async () => {
    try {
      // POST /auth/refresh — the httpOnly cookie is sent automatically
      const res = await apiPost<TokenResponse>('auth/refresh', undefined, { _skipRefresh: true })
      setAccessToken(res.access_token)
      return res.access_token
    } catch {
      clearAuth()
      return null
    }
  })

  setApiUnauthorizedHandler(() => {
    clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  })
}
