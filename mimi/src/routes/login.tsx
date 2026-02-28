import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { ApiError, apiGet, apiPost } from '#/lib/api'
import type { LoginResponse, PageResponse, UserResponse } from '#/lib/types'
import { setAuth } from '#/stores/auth'
import { AuthPageLayout } from '#/components/auth/AuthPageLayout'
import { Button } from '#/components/ui/button'

const inputClass =
  'w-full rounded-md bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'password' | 'token'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      navigate({ to: '/reviews' })
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
      await apiGet<PageResponse<UserResponse>>('users?limit=1', { token: value })
      setAuth(value, null)
      navigate({ to: '/reviews' })
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
    <AuthPageLayout>
      <div className="w-full max-w-md">
        <div className="bg-stone-900/80 backdrop-blur-md border border-white/10 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <span className="text-2xl font-bold text-stone-100">Aura</span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6 text-stone-100">
            Sign In
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-md">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="mb-4 inline-flex rounded-full border border-stone-600 bg-stone-800/80 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setMode('password')
                setError(null)
              }}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                mode === 'password'
                  ? 'bg-stone-700 text-stone-100'
                  : 'text-stone-400 hover:text-stone-200'
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
              className={`rounded-full px-3 py-1.5 transition-colors ${
                mode === 'token'
                  ? 'bg-stone-700 text-stone-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Admin token
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-300 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-stone-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError(null)
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className={`${inputClass} pr-10`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 px-2 text-stone-400 hover:text-stone-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="token"
                  className="block text-sm font-medium text-stone-300 mb-1.5"
                >
                  Admin-issued bearer token
                </label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value)
                    setError(null)
                  }}
                  placeholder="Paste your token"
                  autoComplete="off"
                  disabled={loading}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-stone-500">
                  Tokens are one-time secrets. Revoke them from the admin panel at any time.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Checking…' : 'Sign in with token'}
              </Button>
            </form>
          )}

          {/* SSO: present but inactive for future use */}
          <div className="mt-4">
            <button
              type="button"
              disabled
              className="w-full rounded-md border border-stone-600 bg-stone-800/50 px-4 py-2.5 text-sm font-medium text-stone-500 cursor-not-allowed opacity-70"
              title="SSO coming soon"
            >
              Continue with SSO (coming soon)
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-stone-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="text-stone-200 font-medium hover:underline"
              >
                Create workspace
              </Link>
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/'
              }}
              className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  )
}
