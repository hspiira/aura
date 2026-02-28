import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, ArrowRight, User } from 'lucide-react'
import { useMemo } from 'react'
import {
  performanceSummaryByUserCycleQueryOptions,
  performanceCyclesQueryOptions,
  reviewSessionDetailQueryOptions,
  mutations,
  usersQueryOptions,
} from '#/lib/queries'
import type { ReviewSessionStatus, ReviewSessionType } from '#/lib/types'

export const Route = createFileRoute('/_app/reviews/$id')({
  component: ReviewSessionDetailPage,
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

const VALID_NEXT: Record<ReviewSessionStatus, ReviewSessionStatus[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

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

function ReviewSessionDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: session, isPending } = useQuery(
    reviewSessionDetailQueryOptions(id),
  )
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 500 }))
  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())

  const users = usersData?.items ?? []
  const userNameById = useMemo(
    () => new Map(users.map((u) => [u.id, u.name])),
    [users],
  )
  const cycleByName = useMemo(
    () => new Map(cycles.map((c) => [c.id, c.name])),
    [cycles],
  )

  const { data: summary } = useQuery(
    performanceSummaryByUserCycleQueryOptions(
      session?.user_id ?? '',
      session?.performance_cycle_id ?? '',
    ),
    { enabled: !!session?.user_id && !!session?.performance_cycle_id },
  )

  const updateStatusMutation = useMutation({
    mutationFn: (status: ReviewSessionStatus) =>
      mutations.reviewSessions.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-sessions', id] })
      queryClient.invalidateQueries({ queryKey: ['review-sessions'] })
    },
  })

  const status = session?.status ?? 'scheduled'
  const nextStatuses = VALID_NEXT[status] ?? []

  if (isPending || !session) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500">Loading…</p>
      </div>
    )
  }

  const employeeName = userNameById.get(session.user_id) ?? session.user_id
  const reviewerName = userNameById.get(session.reviewer_id) ?? session.reviewer_id
  const cycleName =
    cycleByName.get(session.performance_cycle_id) ?? session.performance_cycle_id

  return (
    <div className="space-y-6">
      <Link
        to="/reviews"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" />
        Back to review sessions
      </Link>

      {/* Session header card */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${typeBadgeClass(session.session_type)}`}
          >
            {SESSION_TYPE_LABELS[session.session_type]}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(session.status)}`}
          >
            {STATUS_LABELS[session.status]}
          </span>
        </div>
        <dl className="mt-3 grid gap-1 text-sm">
          <div>
            <dt className="text-stone-500">Employee</dt>
            <dd className="font-medium text-stone-900">{employeeName}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Reviewer</dt>
            <dd className="font-medium text-stone-900">{reviewerName}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Cycle</dt>
            <dd className="font-medium text-stone-900">{cycleName}</dd>
          </div>
          {session.scheduled_at && (
            <div>
              <dt className="text-stone-500">Scheduled</dt>
              <dd className="font-medium text-stone-900">
                {format(parseISO(session.scheduled_at), 'MMM d, yyyy HH:mm')}
              </dd>
            </div>
          )}
          {session.completed_at && (
            <div>
              <dt className="text-stone-500">Completed</dt>
              <dd className="font-medium text-stone-900">
                {format(parseISO(session.completed_at), 'MMM d, yyyy HH:mm')}
              </dd>
            </div>
          )}
        </dl>

        {/* Status transition */}
        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="text-sm font-medium text-stone-700">Current status</p>
          <p className="mt-0.5 text-lg font-semibold text-stone-900">
            {STATUS_LABELS[session.status]}
          </p>
          {nextStatuses.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {nextStatuses.map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => updateStatusMutation.mutate(nextStatus)}
                  disabled={updateStatusMutation.isPending}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  {nextStatus === 'in_progress' && 'Mark in progress'}
                  {nextStatus === 'completed' && 'Mark completed'}
                  {nextStatus === 'cancelled' && 'Cancel'}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Linked data */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-stone-900">
          Performance summary
        </h2>
        {summary ? (
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Quantitative score</dt>
              <dd className="font-medium text-stone-800">
                {summary.quantitative_score ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Behavioral score</dt>
              <dd className="font-medium text-stone-800">
                {summary.behavioral_score ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Final weighted score</dt>
              <dd className="font-medium text-stone-800">
                {summary.final_weighted_score ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Rating band</dt>
              <dd className="font-medium text-stone-800">
                {summary.final_rating_band ?? '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-stone-500">
            No performance summary for this employee and cycle.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/people/$id"
            params={{ id: session.user_id }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            <User className="size-4" />
            Employee profile
            <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/objectives"
            search={{ user_id: session.user_id, performance_cycle_id: session.performance_cycle_id }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            Their objectives
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
