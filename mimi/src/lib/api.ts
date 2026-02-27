/**
 * Typed HTTP client for the FastAPI backend.
 * Attaches Authorization: Bearer <token>, handles 401 by invoking onUnauthorized.
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
}

export type GetToken = () => string | null

let getToken: GetToken = () => null

export function setApiTokenGetter(fn: GetToken) {
  getToken = fn
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
  })

  if (response.status === 401) {
    // Only clear and redirect when we actually sent a token (session expired/revoked)
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
