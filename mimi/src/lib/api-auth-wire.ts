/**
 * Wire the API client to the auth store: token getter and 401 handler.
 * Call once at app startup (e.g. from root layout or main).
 */

import { setApiTokenGetter, setApiUnauthorizedHandler } from '#/lib/api'
import { clearAuth, getToken } from '#/stores/auth'

export function wireApiAuth() {
  setApiTokenGetter(getToken)
  setApiUnauthorizedHandler(() => {
    clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  })
}
