import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { apiPost, ApiError } from '#/lib/api'
import {
  departmentsQueryOptions,
  rolesQueryOptions,
} from '#/lib/queries'
import type { LoginResponse } from '#/lib/types'
import { setAuth } from '#/stores/auth'
import { AuthPageLayout } from '#/components/auth/AuthPageLayout'
import { Button } from '#/components/ui/button'

const inputClass =
  'w-full bg-stone-800 border border-stone-600 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleId, setRoleId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email.trim() || !password || !roleId || !departmentId) {
      setError('Fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const resp = await apiPost<LoginResponse, unknown>('auth/signup', {
        name: name.trim(),
        email: email.trim(),
        password,
        role_id: roleId,
        department_id: departmentId,
      })
      setAuth(resp.token, resp.user.id)
      navigate({ to: '/reviews' })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.body === 'object' &&
            err.body &&
            'detail' in (err.body as Record<string, unknown>)
            ? String((err.body as { detail?: string }).detail ?? err.message)
            : err.message,
        )
      } else {
        setError('Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout>
      <div className="w-full max-w-md py-8">
        <div className="bg-stone-900/80 backdrop-blur-md border border-white/10 p-8">
          <div className="flex justify-center mb-6">
            <span className="text-2xl font-bold text-stone-100">Aura</span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-stone-100">
            Create workspace
          </h1>
          <p className="text-center text-stone-400 text-sm mb-6">
            We&apos;ll set up your profile so you can invite your team and run review cycles.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-stone-300 mb-1.5"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                placeholder="How your team knows you"
                autoComplete="name"
                disabled={loading}
                className={inputClass}
              />
            </div>

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
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
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
              <p className="mt-1 text-xs text-stone-500">
                Use a strong password you don&apos;t reuse elsewhere.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-stone-300 mb-1.5"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={roleId}
                  onChange={(e) => {
                    setRoleId(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-stone-300 mb-1.5"
                >
                  Department
                </label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                !email.trim() ||
                !password ||
                !roleId ||
                !departmentId
              }
              className="w-full"
            >
              {loading ? 'Creating account…' : 'Create workspace'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-stone-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-stone-200 font-medium hover:underline"
              >
                Sign in
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
