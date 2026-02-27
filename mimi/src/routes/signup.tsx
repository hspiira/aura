import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiPost, ApiError } from '#/lib/api'
import {
  departmentsQueryOptions,
  rolesQueryOptions,
} from '#/lib/queries'
import type { LoginResponse } from '#/lib/types'
import { setAuth } from '#/stores/auth'

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
      navigate({ to: '/dashboard' })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(typeof err.body === 'object' && err.body && 'detail' in (err.body as any)
          ? String((err.body as { detail?: string }).detail ?? err.message)
          : err.message)
      } else {
        setError('Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="pointer-events-none fixed inset-0 opacity-50" aria-hidden="true">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>
      <div className="relative w-full max-w-5xl">
        <div className="grid gap-8 rounded-2xl border border-stone-200/80 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[minmax(0,1.05fr),minmax(0,1fr)] md:p-8 lg:p-10">
          {/* Left column: narrative */}
          <section className="flex flex-col justify-between border-b border-stone-100 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                Get started with Aura
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                Create your workspace for performance, reviews, and calibration.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                We&apos;ll set up a simple profile so you can invite your team,
                launch review cycles, and keep every objective aligned.
              </p>

              <ul className="mt-6 space-y-2 text-xs text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="mt-[3px] inline-block size-1.5 rounded-full bg-emerald-500" />
                  <span>Connect roles and departments so reviews route to the right people.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[3px] inline-block size-1.5 rounded-full bg-sky-500" />
                  <span>Run structured review sessions with calibration built in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[3px] inline-block size-1.5 rounded-full bg-violet-500" />
                  <span>Unlock analytics on performance, promotion, and rewards decisions.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 hidden items-center justify-between rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-[11px] text-stone-500 md:flex">
              <span>Only admins can see review results. Employees just see what they need.</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">
                Designed for People teams
              </span>
            </div>
          </section>

          {/* Right column: form */}
          <section className="flex flex-col justify-center">
            <div className="rounded-xl border border-stone-200 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-stone-900">
                    Create your account
                  </h2>
                  <p className="mt-1 text-[12px] text-stone-500">
                    We&apos;ll use this to set up your workspace owner profile.
                  </p>
                </div>
                <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-stone-50">
                  Step 1 of 1
                </span>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <label
                      htmlFor="name"
                      className="block text-xs font-medium uppercase tracking-wide text-stone-600"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setError(null)
                      }}
                      placeholder="How your team knows you"
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
                    />
                  </div>
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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="At least 8 characters"
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
                    />
                    <p className="text-[11px] text-stone-500">
                      Use a strong password you don&apos;t reuse elsewhere.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wide text-stone-600">
                      Role
                    </label>
                    <select
                      value={roleId}
                      onChange={(e) => {
                        setRoleId(e.target.value)
                        setError(null)
                      }}
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-2.5 py-2 text-sm text-stone-900 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
                    >
                      <option value="">Select…</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wide text-stone-600">
                      Department
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => {
                        setDepartmentId(e.target.value)
                        setError(null)
                      }}
                      className="w-full rounded-md border border-stone-300 bg-stone-50/70 px-2.5 py-2 text-sm text-stone-900 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50"
                      disabled={loading}
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
                  {loading ? 'Creating account…' : 'Create workspace'}
                </button>
              </form>

              <p className="mt-4 text-center text-[12px] text-stone-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-amber-700 hover:text-amber-800">
                  Sign in
                </Link>
              </p>
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

