import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import {
  calibrationDistributionQueryOptions,
  calibrationSessionsQueryOptions,
  calibrationVarianceQueryOptions,
  departmentsQueryOptions,
  meQueryOptions,
  mutations,
  performanceCyclesQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import type { CalibrationSessionCreate } from '#/lib/types'

export const Route = createFileRoute('/_app/calibration')({
  component: CalibrationPage,
})

function toDatetimeLocal( d: Date ): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

function CalibrationPage() {
  const queryClient = useQueryClient()
  const [cycleId, setCycleId] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<CalibrationSessionCreate>>({
    performance_cycle_id: '',
    department_id: '',
    conducted_by_id: '',
    conducted_at: '',
    notes: null,
  })

  const { data: me } = useQuery(meQueryOptions())
  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 500 }))
  const users = usersData?.items ?? []

  const effectiveCycleId = (cycleId || cycles[0]?.id) ?? ''

  const { data: sessions = [] } = useQuery(
    calibrationSessionsQueryOptions({
      performance_cycle_id: effectiveCycleId || undefined,
      department_id: departmentId || undefined,
    }),
    { enabled: !!effectiveCycleId },
  )
  const { data: distribution = [] } = useQuery(
    calibrationDistributionQueryOptions(effectiveCycleId, departmentId || undefined),
    { enabled: !!effectiveCycleId },
  )
  const { data: variance = [] } = useQuery(
    calibrationVarianceQueryOptions(effectiveCycleId, departmentId || undefined),
    { enabled: !!effectiveCycleId },
  )

  const createMutation = useMutation({
    mutationFn: (body: CalibrationSessionCreate) =>
      mutations.calibrationSessions.create(body),
    mutationKey: ['calibration-sessions', 'create'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibration-sessions'] })
      setFormOpen(false)
      setForm({
        performance_cycle_id: effectiveCycleId,
        department_id: departmentId || '',
        conducted_by_id: me?.user?.id ?? '',
        conducted_at: '',
        notes: null,
      })
    },
  })

  const departmentById = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const maxCount = Math.max(...distribution.map((b) => b.count), 1)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.performance_cycle_id || !form.department_id || !form.conducted_by_id || !form.conducted_at)
      return
    const conductedAt =
      form.conducted_at && form.conducted_at.length >= 16
        ? new Date(form.conducted_at).toISOString()
        : new Date().toISOString()
    createMutation.mutate({
      performance_cycle_id: form.performance_cycle_id,
      department_id: form.department_id,
      conducted_by_id: form.conducted_by_id,
      conducted_at: conductedAt,
      notes: form.notes ?? null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Calibration</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Sessions, score distribution, and variance by department.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({
              performance_cycle_id: effectiveCycleId,
              department_id: departmentId || '',
              conducted_by_id: me?.user?.id ?? '',
              conducted_at: toDatetimeLocal(new Date()),
              notes: null,
            })
            setFormOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
        >
          <Plus className="size-4" />
          New calibration session
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Cycle</span>
          <select
            value={(cycleId || cycles[0]?.id) ?? ''}
            onChange={(e) => setCycleId(e.target.value)}
            className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-stone-800"
          >
            <option value="">Select…</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Department</span>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-stone-800"
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">
            Score distribution
            {effectiveCycleId && (departmentId ? ` · ${departmentById[departmentId] ?? departmentId}` : ' · All')}
          </h2>
          {!effectiveCycleId ? (
            <p className="text-sm text-stone-500">Select a cycle.</p>
          ) : distribution.length === 0 ? (
            <p className="text-sm text-stone-500">No distribution data.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {distribution.map((b) => (
                <div
                  key={b.label}
                  className="flex flex-1 flex-col items-center gap-0.5"
                  title={`${b.label}: ${b.count} (${b.percentage.toFixed(1)}%)`}
                >
                  <div
                    className="w-full min-w-[8px] rounded-t bg-amber-500/70 transition-all"
                    style={{ height: `${(b.count / maxCount) * 100}%` }}
                  />
                  <span className="text-[10px] font-medium text-stone-500">{b.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Variance by department</h2>
          {!effectiveCycleId ? (
            <p className="text-sm text-stone-500">Select a cycle.</p>
          ) : variance.length === 0 ? (
            <p className="text-sm text-stone-500">No variance data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left">
                    <th className="pb-2 font-semibold text-stone-700">Department</th>
                    <th className="pb-2 font-semibold text-stone-700">Mean score</th>
                    <th className="pb-2 font-semibold text-stone-700">Std dev</th>
                    <th className="pb-2 font-semibold text-stone-700">Outlier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {variance.map((v) => (
                    <tr
                      key={v.department_id}
                      className={v.is_outlier ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-stone-50/50'}
                    >
                      <td className="py-2 text-stone-800">
                        {departmentById[v.department_id] ?? v.department_id}
                      </td>
                      <td className="py-2 font-medium text-stone-800">
                        {v.mean_score.toFixed(2)}
                      </td>
                      <td className="py-2 text-stone-600">{v.std_dev.toFixed(2)}</td>
                      <td className="py-2">
                        {v.is_outlier ? (
                          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Yes
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-stone-900">Calibration sessions</h2>
        {!effectiveCycleId ? (
          <p className="text-sm text-stone-500">Select a cycle.</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-stone-500">No sessions for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="pb-2 font-semibold text-stone-700">Cycle</th>
                  <th className="pb-2 font-semibold text-stone-700">Department</th>
                  <th className="pb-2 font-semibold text-stone-700">Conducted by</th>
                  <th className="pb-2 font-semibold text-stone-700">Conducted at</th>
                  <th className="pb-2 font-semibold text-stone-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/50">
                    <td className="py-2 text-stone-600">{cycles.find((c) => c.id === s.performance_cycle_id)?.name ?? s.performance_cycle_id}</td>
                    <td className="py-2 text-stone-800">
                      {departmentById[s.department_id] ?? s.department_id}
                    </td>
                    <td className="py-2 text-stone-800">
                      {userById[s.conducted_by_id] ?? s.conducted_by_id}
                    </td>
                    <td className="py-2 text-stone-600">
                      {format(parseISO(s.conducted_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="max-w-[12rem] truncate py-2 text-stone-600" title={s.notes ?? undefined}>
                      {s.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">New calibration session</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Cycle</label>
                <select
                  value={form.performance_cycle_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, performance_cycle_id: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Department</label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Conducted by</label>
                <select
                  value={form.conducted_by_id}
                  onChange={(e) => setForm((f) => ({ ...f, conducted_by_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Conducted at</label>
                <input
                  type="datetime-local"
                  value={form.conducted_at ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, conducted_at: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Notes (optional)</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
                  rows={2}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600">
                  {(createMutation.error as { body?: { detail?: string } })?.body?.detail ??
                    'Failed to create'}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
