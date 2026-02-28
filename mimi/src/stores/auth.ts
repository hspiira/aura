/**
 * Auth state: JWT access token held in memory (not localStorage).
 * Refresh tokens are httpOnly cookies managed by the browser.
 */

import { Store } from '@tanstack/react-store'

export interface AuthState {
  /** JWT access token — kept in memory only, never persisted to localStorage */
  accessToken: string | null
}

export const authStore = new Store<AuthState>({ accessToken: null })

export function setAccessToken(token: string) {
  authStore.setState(() => ({ accessToken: token }))
}

export function clearAuth() {
  authStore.setState(() => ({ accessToken: null }))
}

export function getToken(): string | null {
  return authStore.state.accessToken
}

export function isAuthenticated(): boolean {
  return authStore.state.accessToken !== null
}
