import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react'
import {
  auditLogsForEntityQueryOptions,
  meQueryOptions,
  mutations,
  objectiveDetailQueryOptions,
  objectiveEvidenceByObjectiveQueryOptions,
  objectiveScoreByObjectiveQueryOptions,
  objectiveTemplatesQueryOptions,
  objectiveUpdatesQueryOptions,
  performanceDimensionsQueryOptions,
  queryKeys,
} from '#/lib/queries'
import { apiPatch } from '#/lib/api'
import { APPROVE_OBJECTIVES, hasPermission } from '#/lib/permissions'
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

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'draft') return 'bg-stone-100 text-stone-600'
  if (
    ['submitted', 'in_progress', 'under_review'].some((x) => s.includes(x))
  )
    return 'bg-amber-100 text-amber-700'
  if (
    ['approved', 'active', 'completed', 'scheduled'].some((x) => s.includes(x))
  )
    return 'bg-emerald-100 text-emerald-700'
  if (s === 'rejected' || s === 'at_risk') return 'bg-red-100 text-red-600'
  if (s === 'closed' || s === 'cancelled') return 'bg-stone-200 text-stone-500'
  return 'bg-stone-100 text-stone-600'
}

function weightDisplay(weight: string): string {
  const n = Number(weight)
  return n <= 1 && n > 0 ? `${Math.round(n * 100)}%` : `${weight}%`
}

function ObjectiveDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [amendOpen, setAmendOpen] = useState(false)
  const [progressFormOpen, setProgressFormOpen] = useState(false)
  const [evidenceFormOpen, setEvidenceFormOpen] = useState(false)
  const [progressActual, setProgressActual] = useState('')
  const [progressComment, setProgressComment] = useState('')
  const [evidenceDescription, setEvidenceDescription] = useState('')
  const [evidenceFilePath, setEvidenceFilePath] = useState('')

  const { data: me } = useQuery(meQueryOptions())
  const { data: objective, isPending } = useQuery(objectiveDetailQueryOptions(id))
  const { data: score } = useQuery(objectiveScoreByObjectiveQueryOptions(id))
  const { data: updatesData } = useQuery(
    objectiveUpdatesQueryOptions({ objective_id: id, limit: 50 }),
  )
  const { data: evidence } = useQuery(
    objectiveEvidenceByObjectiveQueryOptions(id),
  )
  const { data: auditData } = useQuery(
    auditLogsForEntityQueryOptions('objective', id, { limit: 30 }),
  )
  const { data: dimensions } = useQuery(performanceDimensionsQueryOptions())
  const { data: templates } = useQuery(objectiveTemplatesQueryOptions())

  const hasApprove = hasPermission(me?.permissions ?? [], APPROVE_OBJECTIVES)
  const dimensionName = useMemo(
    () =>
      dimensions?.find((d) => d.id === objective?.dimension_id)?.name ?? '—',
    [dimensions, objective?.dimension_id],
  )
  const templateName = useMemo(
    () =>
      objective?.template_id
        ? templates?.find((t) => t.id === objective.template_id)?.title ?? '—'
        : null,
    [objective?.template_id, templates],
  )

  const statusTransition = useMutation({
    mutationFn: (newStatus: string) =>
      apiPatch<unknown, { status: string }>(`objectives/${id}/status`, {
        status: newStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives', id] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
    },
  })

  const addProgressMutation = useMutation({
    mutationFn: (body: {
      objective_id: string
      actual_value?: string | null
      comment?: string | null
      submitted_by: string
    }) => mutations.objectiveUpdates.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.objectiveUpdates.all({ objective_id: id, limit: 50 }),
      })
      setProgressActual('')
      setProgressComment('')
      setProgressFormOpen(false)
    },
  })

  const addEvidenceMutation = useMutation({
    mutationFn: (body: {
      objective_id: string
      description?: string | null
      file_path?: string | null
      uploaded_by: string
    }) => mutations.objectiveEvidence.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.objectiveEvidence.byObjective(id),
      })
      setEvidenceDescription('')
      setEvidenceFilePath('')
      setEvidenceFormOpen(false)
    },
  })

  const currentStatus = objective?.status.toLowerCase() ?? ''
  const currentStatusIndex = objective
    ? STATUS_ORDER.indexOf(currentStatus)
    : -1
  const allNextStatuses = VALID_NEXT[currentStatus] ?? []
  const visibleNextStatuses = useMemo(() => {
    if (!hasApprove && (currentStatus === 'submitted' || currentStatus === 'approved'))
      return []
    return allNextStatuses
  }, [hasApprove, currentStatus, allNextStatuses])

  if (isPending || !objective) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500">Loading…</p>
      </div>
    )
  }

  const updates = updatesData?.items ?? []
  const auditLogs = auditData?.items ?? []
  const locked = !!objective.already_locked || !!objective.locked_at
  const submittedBy = me?.user.name ?? me?.user.id ?? ''

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/objectives"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" />
          Back to objectives
        </Link>
        {!locked && (
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

      {/* Header card */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-stone-900">
            {objective.title}
          </h1>
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(objective.status)}`}
          >
            {objective.status.replace(/_/g, ' ')}
          </span>
          {locked && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Locked
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">
          <span>
            {format(parseISO(objective.start_date), 'MMM d')} –{' '}
            {format(parseISO(objective.end_date), 'MMM d')}
          </span>
          {score && (
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-medium text-stone-700">
              Score: {score.achievement_percentage}% (weighted {score.weighted_score})
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
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
                {objective.target_value != null
                  ? `${objective.target_value} ${objective.unit_of_measure ?? ''}`.trim()
                  : '—'}
              </dd>
              <dt className="text-stone-500">Weight</dt>
              <dd className="text-stone-800">{weightDisplay(objective.weight)}</dd>
              <dt className="text-stone-500">Dimension</dt>
              <dd className="text-stone-800">{dimensionName}</dd>
              {templateName != null && (
                <>
                  <dt className="text-stone-500">Template</dt>
                  <dd className="text-stone-800">{templateName}</dd>
                </>
              )}
            </dl>
          </section>

          {/* Status workflow */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Status workflow
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s, i) => {
                const reached = i <= currentStatusIndex
                return (
                  <span
                    key={s}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      reached
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {STATUS_LABELS[s] ?? s}
                  </span>
                )
              })}
            </div>
            {visibleNextStatuses.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleNextStatuses.map((toStatus) => (
                  <button
                    key={toStatus}
                    type="button"
                    onClick={() => statusTransition.mutate(toStatus)}
                    disabled={statusTransition.isPending}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
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
              <ul className="space-y-2 divide-y divide-stone-100">
                {updates.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-baseline justify-between gap-2 py-2 first:pt-0"
                  >
                    <span className="text-sm text-stone-700">
                      {u.actual_value != null ? (
                        <>Actual: {u.actual_value}</>
                      ) : (
                        '—'
                      )}
                      {u.comment && (
                        <span className="ml-1 text-stone-500">
                          · {u.comment}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-stone-400">
                      {u.submitted_by}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!locked && (
              <div className="mt-3">
                {!progressFormOpen ? (
                  <button
                    type="button"
                    onClick={() => setProgressFormOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    <Plus className="size-4" />
                    Add progress update
                    <ChevronDown className="size-4" />
                  </button>
                ) : (
                  <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                    <button
                      type="button"
                      onClick={() => setProgressFormOpen(false)}
                      className="mb-2 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
                    >
                      <ChevronUp className="size-4" />
                      Collapse
                    </button>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        addProgressMutation.mutate({
                          objective_id: id,
                          actual_value: progressActual.trim() || null,
                          comment: progressComment.trim() || null,
                          submitted_by: submittedBy,
                        })
                      }}
                      className="space-y-2"
                    >
                      <input
                        type="text"
                        placeholder="Actual value"
                        value={progressActual}
                        onChange={(e) => setProgressActual(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        placeholder="Comment"
                        value={progressComment}
                        onChange={(e) => setProgressComment(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addProgressMutation.isPending}
                          className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800 disabled:opacity-60"
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => setProgressFormOpen(false)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Evidence */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <FileText className="size-4" />
              Evidence
            </h2>
            {!evidence?.length ? (
              <p className="text-sm text-stone-500">No evidence attached.</p>
            ) : (
              <ul className="space-y-2 divide-y divide-stone-100 text-sm">
                {evidence.map((e) => (
                  <li key={e.id} className="py-2 first:pt-0">
                    <span className="text-stone-700">
                      {e.description ?? e.file_path ?? 'Evidence'}
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-400">
                      {e.uploaded_by}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!locked && (
              <div className="mt-3">
                {!evidenceFormOpen ? (
                  <button
                    type="button"
                    onClick={() => setEvidenceFormOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    <Plus className="size-4" />
                    Attach evidence
                  </button>
                ) : (
                  <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        addEvidenceMutation.mutate({
                          objective_id: id,
                          description: evidenceDescription.trim() || null,
                          file_path: evidenceFilePath.trim() || null,
                          uploaded_by: submittedBy,
                        })
                      }}
                      className="space-y-2"
                    >
                      <textarea
                        placeholder="Description"
                        value={evidenceDescription}
                        onChange={(e) =>
                          setEvidenceDescription(e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="File path"
                        value={evidenceFilePath}
                        onChange={(e) => setEvidenceFilePath(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addEvidenceMutation.isPending}
                          className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800 disabled:opacity-60"
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvidenceFormOpen(false)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Audit log */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Audit log
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-stone-500">No activity.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto divide-y divide-stone-100">
                {auditLogs.map((entry) => (
                  <li key={entry.id} className="py-2 first:pt-0 text-xs">
                    <span className="font-semibold text-stone-900">
                      {entry.action}
                    </span>
                    <span className="text-stone-500">
                      {' '}
                      {entry.changed_at
                        ? format(parseISO(entry.changed_at), 'MMM d HH:mm')
                        : '—'}
                      {entry.changed_by && ` · ${entry.changed_by}`}
                    </span>
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
