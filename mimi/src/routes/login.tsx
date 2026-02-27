import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ApiError, apiGet, apiPost } from '#/lib/api'
import type { LoginResponse, PageResponse, UserResponse } from '#/lib/types'
import { setAuth } from '#/stores/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'password' | 'token'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    const emailValue = email.trim()
    if (!emailValue || !password) {
      setError('Enter your email and password.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const resp = await apiPost<LoginResponse, unknown>('auth/login', {
        email: emailValue,
        password,
      })
      setAuth(resp.token, resp.user.id)
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid email or password.'
          : 'Something went wrong. Try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleTokenLogin(e: React.FormEvent) {
    e.preventDefault()
    const value = token.trim()
    if (!value) {
      setError('Enter your token.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      // Validate token with an authenticated endpoint (health is unauthenticated)
      await apiGet<PageResponse<UserResponse>>('users?limit=1', { token: value })
      setAuth(value, null)
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid or expired token.'
          : 'Something went wrong. Try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      {/* subtle glow to match landing */}
      <div className="pointer-events-none fixed inset-0 opacity-50" aria-hidden="true">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="grid gap-8 rounded-2xl border border-stone-200/80 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[minmax(0,1.1fr),minmax(0,1fr)] md:p-8 lg:p-10">
          {/* Left column: brand & narrative */}
          <section className="flex flex-col justify-between border-b border-stone-100 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                Aura Performance Cloud
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                Sign in to keep every review cycle in motion.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                A single workspace for objectives, reviews, calibration, and insights.
                Log back in to pick up right where your teams left off.
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-4 text-xs text-stone-600 sm:grid-cols-3">
                <div className="rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2">
                  <dt className="text-[11px] font-medium text-stone-500">Review sessions</dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-900">
                    Always in sync
                  </dd>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2">
                  <dt className="text-[11px] font-medium text-stone-500">Calibration</dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-900">
                    Bias-aware scoring
                  </dd>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2">
                  <dt className="text-[11px] font-medium text-stone-500">Security</dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-900">
                    SSO & tokens
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 hidden items-center justify-between rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-[11px] text-stone-500 md:flex">
              <span>✨ Tip: you can also sign in with an admin-issued API token.</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">
                Secure by default
              </span>
            </div>
          </section>

          {/* Right column: auth card */}
          <section className="flex flex-col justify-center">
            <div className="rounded-xl border border-stone-200 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-stone-900">
                    Welcome back
                  </h2>
                  <p className="mt-1 text-[12px] text-stone-500">
                    Choose how you want to sign in.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  Live workspace
                </span>
              </div>

              <div className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('password')
                    setError(null)
                  }}
                  className={`rounded-full px-3 py-1.5 ${
                    mode === 'password'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Email & password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('token')
                    setError(null)
                  }}
                  className={`rounded-full px-3 py-1.5 ${
                    mode === 'token'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Admin token
                </button>
              </div>

              {mode === 'password' ? (
                <form onSubmit={handlePasswordLogin} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium uppercase tracking-wide text-stone-600"
                    >
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                      }}
                      placeholder="you@company.com"
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium uppercase tracking-wide text-stone-600"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="Enter your password"
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="text-[13px] text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:opacity-60"
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTokenLogin} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="token"
                      className="block text-xs font-medium uppercase tracking-wide text-stone-600"
                    >
                      Admin-issued bearer token
                    </label>
                    <input
                      id="token"
                      type="password"
                      autoComplete="off"
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value)
                        setError(null)
                      }}
                      placeholder="Paste your token"
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
                    />
                    <p className="text-[11px] text-stone-500">
                      Tokens are one-time secrets. Revoke them from the admin panel at any time.
                    </p>
                  </div>
                  {error && (
                    <p className="text-[13px] text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:opacity-60"
                  >
                    {loading ? 'Checking…' : 'Sign in with token'}
                  </button>
                </form>
              )}

              <div className="mt-5 space-y-3 text-[12px] text-stone-500">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/v1/auth/sso/start?provider=default'
                  }}
                  className="w-full rounded-md border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  Continue with SSO
                </button>
                <p className="text-center">
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="font-medium text-amber-700 hover:text-amber-800">
                    Create workspace
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-4 text-center text-[11px] text-stone-400">
          Enterprise Performance Management · Aura
        </p>
      </div>
    </main>
  )
}
