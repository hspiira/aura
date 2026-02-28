/**
 * Auth state: token and userId, persisted to localStorage.
 * Wire setApiTokenGetter and setApiUnauthorizedHandler from api.ts at app init.
 */

import { Store } from '@tanstack/react-store'

const STORAGE_KEY = 'aura_auth'

export interface AuthState {
  token: string | null
  userId: string | null
}

function readPersisted(): AuthState {
  if (typeof window === 'undefined') {
    return { token: null, userId: null }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, userId: null }
    const data = JSON.parse(raw) as { token?: string; userId?: string }
    return {
      token: typeof data.token === 'string' ? data.token : null,
      userId: typeof data.userId === 'string' ? data.userId : null,
    }
  } catch {
    return { token: null, userId: null }
  }
}

function persist(state: AuthState) {
  if (typeof window === 'undefined') return
  try {
    if (state.token === null && state.userId === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        token: state.token,
        userId: state.userId,
      }))
    }
  } catch {
    // ignore
  }
}

const initialState = readPersisted()

export const authStore = new Store<AuthState>(initialState)

/** Sync from localStorage once on first read in the browser (SSR may have left store empty). */
function rehydrateOnce(): void {
  if (typeof window === 'undefined') return
  const state = authStore.state
  if (state.token !== null) return
  const persisted = readPersisted()
  if (persisted.token !== null) {
    authStore.setState(() => ({ token: persisted.token, userId: persisted.userId }))
  }
}

export function setAuth(token: string, userId: string | null = null) {
  authStore.setState(() => ({ token, userId }))
  persist({ token, userId })
}

export function clearAuth() {
  authStore.setState(() => ({ token: null, userId: null }))
  persist({ token: null, userId: null })
}

export function getToken(): string | null {
  rehydrateOnce()
  return authStore.state.token
}

export function getUserId(): string | null {
  return authStore.state.userId
}

export function isAuthenticated(): boolean {
  rehydrateOnce()
  const state = authStore.state
  return state.token !== null && state.token.length > 0
}
