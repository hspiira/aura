import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import {
  reviewSessionsQueryOptions,
  performanceCyclesQueryOptions,
  usersQueryOptions,
  mutations,
} from '#/lib/queries'
import type { ReviewSessionCreate, ReviewSessionStatus, ReviewSessionType } from '#/lib/types'

export const Route = createFileRoute('/_app/reviews')({
  component: ReviewsPage,
})

const SESSION_TYPE_LABELS: Record<ReviewSessionType, string> = {
  mid_year: 'Mid-year',
  final: 'Final',
}

const STATUS_LABELS: Record<ReviewSessionStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function ReviewsPage() {
  const queryClient = useQueryClient()
  const [cycleFilter, setCycleFilter] = useState<string>('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<ReviewSessionCreate>>({
    user_id: '',
    performance_cycle_id: '',
    reviewer_id: '',
    session_type: 'mid_year',
    status: 'scheduled',
    scheduled_at: null,
  })

  const { data: sessions = [] } = useQuery(
    reviewSessionsQueryOptions({
      performance_cycle_id: cycleFilter || undefined,
    }),
  )
  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 200 }))
  const users = usersData?.items ?? []

  const createMutation = useMutation({
    mutationFn: (body: ReviewSessionCreate) => mutations.reviewSessions.create(body),
    mutationKey: ['review-sessions', 'create'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-sessions'] })
      setFormOpen(false)
      setForm({
        user_id: '',
        performance_cycle_id: '',
        reviewer_id: '',
        session_type: 'mid_year',
        status: 'scheduled',
        scheduled_at: null,
      })
    },
  })

  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.user_id || !form.performance_cycle_id || !form.reviewer_id) return
    createMutation.mutate({
      user_id: form.user_id,
      performance_cycle_id: form.performance_cycle_id,
      reviewer_id: form.reviewer_id,
      session_type: form.session_type ?? 'mid_year',
      status: form.status ?? 'scheduled',
      scheduled_at: form.scheduled_at ?? null,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Review sessions</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Schedule and track performance reviews.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
        >
          <Plus className="size-4" />
          New review session
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Cycle</span>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-stone-800"
          >
            <option value="">All</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Employee</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Reviewer</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Scheduled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No review sessions.
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 text-stone-800">
                  {userById[s.user_id] ?? s.user_id}
                </td>
                <td className="px-4 py-3 text-stone-800">
                  {userById[s.reviewer_id] ?? s.reviewer_id}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                    {SESSION_TYPE_LABELS[s.session_type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium capitalize text-stone-700">
                    {STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {s.scheduled_at
                    ? format(parseISO(s.scheduled_at), 'MMM d, yyyy HH:mm')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">New review session</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Employee</label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
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
                <label className="mb-1 block text-sm font-medium text-stone-700">Reviewer</label>
                <select
                  value={form.reviewer_id}
                  onChange={(e) => setForm((f) => ({ ...f, reviewer_id: e.target.value }))}
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
                <label className="mb-1 block text-sm font-medium text-stone-700">Type</label>
                <select
                  value={form.session_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      session_type: e.target.value as ReviewSessionType,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="mid_year">Mid-year</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Scheduled at (optional)
                </label>
                <input
                  type="datetime-local"
                  value={
                    form.scheduled_at
                      ? form.scheduled_at.slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
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
