import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ApiError, apiPost } from '#/lib/api'
import { setAccessToken } from '#/stores/auth'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await apiPost<TokenResponse, { email: string; password: string }>(
        'auth/login',
        { email: email.trim(), password },
      )
      setAccessToken(res.access_token)
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      {/* subtle glow to match landing */}
      <div className="pointer-events-none fixed inset-0 opacity-50" aria-hidden="true">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="border border-stone-200/80 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-stone-900">
            Sign in
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            Sign in with your email and password.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-stone-700 mb-1">
                Email
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
                className="w-full rounded-sm border border-stone-300 bg-stone-50/50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/60 focus:outline-none focus:ring-1 focus:ring-amber-600/40"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-stone-700 mb-1">
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
                className="w-full rounded-sm border border-stone-300 bg-stone-50/50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/60 focus:outline-none focus:ring-1 focus:ring-amber-600/40"
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
              className="w-full rounded-sm bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-stone-400">
          Enterprise Performance Management · Aura
        </p>
      </div>
    </main>
  )
}
