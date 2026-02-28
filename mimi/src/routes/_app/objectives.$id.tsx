import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  FileText,
  Pencil,
  RefreshCw,
  Target,
} from 'lucide-react'
import {
  auditLogsForEntityQueryOptions,
  objectiveDetailQueryOptions,
  objectiveEvidenceByObjectiveQueryOptions,
  objectiveScoreByObjectiveQueryOptions,
  objectiveUpdatesQueryOptions,
} from '#/lib/queries'
import { apiPatch } from '#/lib/api'
import { AmendObjectiveDrawer } from '#/components/objectives/AmendObjectiveDrawer'

export const Route = createFileRoute('/_app/objectives/$id')({
  component: ObjectiveDetailPage,
})

const STATUS_ORDER = [
  'draft',
  'submitted',
  'rejected',
  'approved',
  'active',
  'at_risk',
  'completed',
  'under_review',
  'closed',
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  rejected: 'Rejected',
  approved: 'Approved',
  active: 'Active',
  at_risk: 'At risk',
  completed: 'Completed',
  under_review: 'Under review',
  closed: 'Closed',
}

const VALID_NEXT: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['rejected', 'approved'],
  rejected: ['draft'],
  approved: ['active'],
  active: ['at_risk', 'completed'],
  at_risk: ['active', 'completed'],
  completed: ['under_review'],
  under_review: ['closed'],
  closed: [],
}

function ObjectiveDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [amendOpen, setAmendOpen] = useState(false)

  const { data: objective, isPending } = useQuery(objectiveDetailQueryOptions(id))
  const { data: score } = useQuery(objectiveScoreByObjectiveQueryOptions(id))
  const { data: updatesData } = useQuery(
    objectiveUpdatesQueryOptions({ objective_id: id, limit: 50 }),
  )
  const { data: evidence } = useQuery(objectiveEvidenceByObjectiveQueryOptions(id))
  const { data: auditData } = useQuery(
    auditLogsForEntityQueryOptions('objective', id, { limit: 30 }),
  )

  const statusTransition = useMutation({
    mutationFn: (newStatus: string) =>
      apiPatch<unknown, { status: string }>(`objectives/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives', id] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
    },
  })

  const currentStatusIndex = objective
    ? STATUS_ORDER.indexOf(objective.status.toLowerCase())
    : -1

  if (isPending || !objective) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500">Loading…</p>
      </div>
    )
  }

  const updates = updatesData?.items ?? []
  const auditLogs = auditData?.items ?? []
  const nextStatuses = VALID_NEXT[objective.status.toLowerCase()] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/objectives"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" />
          Back to objectives
        </Link>
        {!objective.already_locked && objective.locked_at === null && (
          <button
            type="button"
            onClick={() => setAmendOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Pencil className="size-4" />
            Amend
          </button>
        )}
      </div>

      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">{objective.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium capitalize text-stone-700">
            {objective.status}
          </span>
          <span className="text-sm text-stone-500">
            {format(parseISO(objective.start_date), 'MMM d')} –{' '}
            {format(parseISO(objective.end_date), 'MMM d')}
          </span>
          {score && (
            <span className="text-sm font-medium text-stone-700">
              Score: {score.achievement_percentage}% (weighted {score.weighted_score})
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + status timeline + updates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Full details */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Target className="size-4" />
              Details
            </h2>
            <dl className="grid gap-2 text-sm">
              {objective.description && (
                <>
                  <dt className="text-stone-500">Description</dt>
                  <dd className="text-stone-800">{objective.description}</dd>
                </>
              )}
              <dt className="text-stone-500">KPI type</dt>
              <dd className="text-stone-800">{objective.kpi_type ?? '—'}</dd>
              <dt className="text-stone-500">Target</dt>
              <dd className="text-stone-800">
                {objective.target_value != null ? `${objective.target_value} ${objective.unit_of_measure ?? ''}` : '—'}
              </dd>
              <dt className="text-stone-500">Weight</dt>
              <dd className="text-stone-800">
                {Number(objective.weight) <= 1 && Number(objective.weight) > 0
                  ? `${Math.round(Number(objective.weight) * 100)}%`
                  : `${objective.weight}%`}
              </dd>
            </dl>
          </section>

          {/* Status timeline */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Status</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s, i) => {
                const reached = i <= currentStatusIndex
                return (
                  <span
                    key={s}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      reached ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {STATUS_LABELS[s] ?? s}
                  </span>
                )
              })}
            </div>
            {nextStatuses.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {nextStatuses.map((toStatus) => (
                  <button
                    key={toStatus}
                    type="button"
                    onClick={() => statusTransition.mutate(toStatus)}
                    disabled={statusTransition.isPending}
                    className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                  >
                    → {STATUS_LABELS[toStatus] ?? toStatus}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Progress updates feed */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <RefreshCw className="size-4" />
              Progress updates
            </h2>
            {updates.length === 0 ? (
              <p className="text-sm text-stone-500">No updates yet.</p>
            ) : (
              <ul className="space-y-2">
                {updates.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-baseline justify-between gap-2 border-b border-stone-50 pb-2 last:border-0"
                  >
                    <span className="text-sm text-stone-700">
                      {u.actual_value != null ? (
                        <>Actual: {u.actual_value}</>
                      ) : (
                        '—'
                      )}
                      {u.comment && (
                        <span className="ml-1 text-stone-500">· {u.comment}</span>
                      )}
                    </span>
                    <span className="text-xs text-stone-400">by {u.submitted_by}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: evidence + audit */}
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <FileText className="size-4" />
              Evidence
            </h2>
            {!evidence?.length ? (
              <p className="text-sm text-stone-500">No evidence attached.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {evidence.map((e) => (
                  <li key={e.id} className="text-stone-700">
                    {e.description ?? e.file_path ?? 'Evidence'}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Audit log</h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-stone-500">No activity.</p>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-auto text-xs">
                {auditLogs.map((entry) => (
                  <li key={entry.id} className="text-stone-600">
                    <span className="font-medium text-stone-700">{entry.action}</span>
                    {' · '}
                    {format(parseISO(entry.created_at), 'MMM d HH:mm')}
                    {entry.changed_by && ` · ${entry.changed_by}`}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <AmendObjectiveDrawer
        open={amendOpen}
        onOpenChange={setAmendOpen}
        objectiveId={id}
        currentTarget={objective.target_value}
        currentWeight={objective.weight}
      />
    </div>
  )
}
