import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
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
    <AuthPageLayout>
      <div className="w-full max-w-md">
        <div className="bg-stone-900/80 backdrop-blur-md border border-white/10 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <span className="text-2xl font-bold text-stone-100">Aura</span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6 text-stone-100">
            Sign In
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
              {loading ? 'Signing in…' : 'Sign in'}
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
