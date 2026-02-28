import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CircleDot,
  FileType,
  Plus,
  User,
  UserCheck,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '#/components/ui/table'
import {
  mutations,
  performanceCyclesQueryOptions,
  reviewSessionsQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import type {
  ReviewSessionCreate,
  ReviewSessionResponse,
  ReviewSessionStatus,
  ReviewSessionType,
} from '#/lib/types'

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

const TYPE_OPTIONS: ReviewSessionType[] = ['mid_year', 'final']
const STATUS_OPTIONS: ReviewSessionStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]

function typeBadgeClass(t: ReviewSessionType): string {
  return t === 'mid_year'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-violet-100 text-violet-800'
}

function statusBadgeClass(s: ReviewSessionStatus): string {
  switch (s) {
    case 'scheduled':
      return 'bg-stone-100 text-stone-700'
    case 'in_progress':
      return 'bg-amber-100 text-amber-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'cancelled':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-stone-100 text-stone-600'
  }
}

function ReviewsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isListPage = pathname === '/reviews'
  const queryClient = useQueryClient()
  const [cycleFilter, setCycleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
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
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 500 }))
  const users = usersData?.items ?? []

  const userByName = useMemo(
    () => new Map(users.map((u) => [u.id, u.name])),
    [users],
  )
  const cycleByName = useMemo(
    () => new Map(cycles.map((c) => [c.id, c.name])),
    [cycles],
  )

  const filteredSessions = useMemo(() => {
    return sessions.filter((s: ReviewSessionResponse) => {
      if (statusFilter && s.status !== statusFilter) return false
      if (typeFilter && s.session_type !== typeFilter) return false
      return true
    })
  }, [sessions, statusFilter, typeFilter])

  const createMutation = useMutation({
    mutationFn: (body: ReviewSessionCreate) =>
      mutations.reviewSessions.create(body),
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
    <div className="space-y-6">
      {isListPage && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-stone-900">
                Review sessions
              </h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Schedule and track one-on-one review sessions.
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

          <div className="flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-white p-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-500">Cycle</span>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700"
              >
                <option value="">All</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-500">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-500">Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700"
              >
                <option value="">All</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {SESSION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <TableContainer>
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableHeaderRow>
                  <TableHead icon={<User className="size-3" />}>
                    Employee
                  </TableHead>
                  <TableHead icon={<UserCheck className="size-3" />}>
                    Reviewer
                  </TableHead>
                  <TableHead icon={<Calendar className="size-3" />}>
                    Cycle
                  </TableHead>
                  <TableHead icon={<FileType className="size-3" />}>
                    Type
                  </TableHead>
                  <TableHead icon={<CircleDot className="size-3" />}>
                    Status
                  </TableHead>
                  <TableHead icon={<CalendarClock className="size-3" />}>
                    Scheduled
                  </TableHead>
                  <TableHead
                    className="w-20 border-r-0 text-right"
                    icon={<ArrowRight className="size-3" />}
                  >
                    Actions
                  </TableHead>
                </TableHeaderRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="border-r-0 py-8 text-center text-sm text-stone-500"
                    >
                      No review sessions.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          to="/reviews/$id"
                          params={{ id: row.id }}
                          className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                        >
                          {userByName.get(row.user_id) ?? row.user_id}
                        </Link>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {userByName.get(row.reviewer_id) ?? row.reviewer_id}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {cycleByName.get(row.performance_cycle_id) ??
                          row.performance_cycle_id}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${typeBadgeClass(row.session_type)}`}
                        >
                          {SESSION_TYPE_LABELS[row.session_type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {row.scheduled_at
                          ? format(
                              parseISO(row.scheduled_at),
                              'MMM d, yyyy HH:mm',
                            )
                          : '—'}
                      </TableCell>
                      <TableCell className="border-r-0 text-right">
                        <Link
                          to="/reviews/$id"
                          params={{ id: row.id }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          View
                          <ArrowRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      <Outlet />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              New review session
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Employee
                </label>
                <select
                  value={form.user_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, user_id: e.target.value }))
                  }
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Cycle
                </label>
                <select
                  value={form.performance_cycle_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      performance_cycle_id: e.target.value,
                    }))
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Reviewer
                </label>
                <select
                  value={form.reviewer_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reviewer_id: e.target.value }))
                  }
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Type
                </label>
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
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as ReviewSessionStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
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
                      scheduled_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600">
                  {(createMutation.error as { body?: { detail?: string } })
                    ?.body?.detail ?? 'Failed to create'}
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
