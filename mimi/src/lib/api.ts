/**
 * Typed HTTP client for the FastAPI backend.
 * Attaches Authorization: Bearer <JWT>, handles 401 with automatic token refresh.
 */

const env = import.meta.env as unknown as { VITE_API_BASE?: string }
const DEFAULT_BASE = env.VITE_API_BASE?.trim() ? env.VITE_API_BASE : '/api/v1'

let onUnauthorized: (() => void) | null = null

export function setApiUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function getApiBase(): string {
  return DEFAULT_BASE
}

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface ApiRequestOptions<TBody = unknown> {
  method?: ApiMethod
  body?: TBody
  headers?: Record<string, string>
  /** Optional: override token (e.g. for login flow). If not provided, getToken() is used. */
  token?: string | null
  /** Skip automatic token refresh on 401 (used internally to prevent loops) */
  _skipRefresh?: boolean
}

export type GetToken = () => string | null
export type RefreshFn = () => Promise<string | null>

let getToken: GetToken = () => null
let refreshTokenFn: RefreshFn | null = null

export function setApiTokenGetter(fn: GetToken) {
  getToken = fn
}

export function setApiRefreshFn(fn: RefreshFn) {
  refreshTokenFn = fn
}

function buildHeaders(options: ApiRequestOptions & { token?: string | null }): HeadersInit {
  const token = options.token !== undefined ? options.token : getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Singleton refresh promise to coalesce concurrent 401s
let activeRefresh: Promise<string | null> | null = null

export async function apiRequest<TResponse = unknown, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const base = getApiBase()
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const method = options.method ?? 'GET'
  const body = options.body !== undefined ? JSON.stringify(options.body) : undefined
  const hadToken = !!(options.token !== undefined ? options.token : getToken())
  const response = await fetch(url, {
    method,
    headers: buildHeaders(options),
    body,
    credentials: 'include', // send httpOnly cookies (refresh token)
  })

  if (response.status === 401) {
    // Try silent refresh if we have a refresh function and haven't already tried
    if (hadToken && refreshTokenFn && !options._skipRefresh) {
      // Coalesce concurrent refresh attempts
      if (!activeRefresh) {
        activeRefresh = refreshTokenFn().finally(() => { activeRefresh = null })
      }
      const newToken = await activeRefresh
      if (newToken) {
        // Retry the original request with the new token
        return apiRequest<TResponse, TBody>(path, {
          ...options,
          token: newToken,
          _skipRefresh: true,
        })
      }
    }
    // Refresh failed or not available — trigger unauthorized handler
    if (hadToken) onUnauthorized?.()
    throw new ApiError('Unauthorized', 401)
  }

  if (!response.ok) {
    let errBody: unknown
    try {
      const text = await response.text()
      errBody = text ? JSON.parse(text) : undefined
    } catch {
      errBody = undefined
    }
    const detail =
      (errBody as { detail?: string }).detail ??
      (response.statusText || `Request failed (${response.status})`)
    throw new ApiError(detail, response.status, errBody)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  const text = await response.text()
  if (!text) return undefined as TResponse
  return JSON.parse(text) as TResponse
}

/** GET helper */
export function apiGet<T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...options, method: 'GET' })
}

/** POST helper */
export function apiPost<T, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiRequestOptions<TBody>, 'method'>,
) {
  return apiRequest<T, TBody>(path, { ...options, method: 'POST', body })
}

/** PATCH helper */
export function apiPatch<T, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiRequestOptions<TBody>, 'method'>,
) {
  return apiRequest<T, TBody>(path, { ...options, method: 'PATCH', body })
}

/** PUT helper */
export function apiPut<T, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiRequestOptions<TBody>, 'method'>,
) {
  return apiRequest<T, TBody>(path, { ...options, method: 'PUT', body })
}

/** DELETE helper */
export function apiDelete<T = void>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}
