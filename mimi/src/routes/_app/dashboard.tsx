import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { format, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  auditLogsRecentQueryOptions,
  meQueryOptions,
  objectiveScoreByObjectiveQueryOptions,
  objectivesQueryOptions,
  performanceCyclesQueryOptions,
  performanceSummaryByUserCycleQueryOptions,
} from '#/lib/queries'
import type { PerformanceCycleResponse } from '#/lib/types'
import {
  selectedCycleStore,
  setSelectedCycleId,
} from '#/stores/selected-cycle'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function cycleWeekProgress(cycle: PerformanceCycleResponse): {
  currentWeek: number
  totalWeeks: number
  progressPct: number
  startLabel: string
  endLabel: string
  lockPositionPct: number | null
  lockLabel: string | null
} {
  const start = parseISO(cycle.start_date)
  const end = parseISO(cycle.end_date)
  const now = new Date()
  const totalMs = end.getTime() - start.getTime()
  const elapsed = Math.max(0, now.getTime() - start.getTime())
  const totalWeeks = Math.max(1, Math.ceil(totalMs / (7 * 24 * 60 * 60 * 1000)))
  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1),
  )
  const progressPct = totalMs > 0 ? Math.min(100, (elapsed / totalMs) * 100) : 0
  let lockPositionPct: number | null = null
  let lockLabel: string | null = null
  if (cycle.objectives_lock_date) {
    const lockDate = parseISO(cycle.objectives_lock_date)
    if (lockDate >= start && lockDate <= end) {
      lockPositionPct =
        totalMs > 0
          ? Math.min(100, ((lockDate.getTime() - start.getTime()) / totalMs) * 100)
          : null
      lockLabel = `Objectives lock on ${format(lockDate, 'MMM d')}`
    }
  }
  return {
    currentWeek,
    totalWeeks,
    progressPct,
    startLabel: format(start, 'MMM d'),
    endLabel: format(end, 'MMM d'),
    lockPositionPct,
    lockLabel,
  }
}

function getActiveCycleId(
  cycles: PerformanceCycleResponse[],
  selectedId: string | null,
): string | null {
  if (selectedId && cycles.some((c) => c.id === selectedId)) return selectedId
  const now = new Date()
  const active = cycles.find((c) => {
    const start = parseISO(c.start_date)
    const end = parseISO(c.end_date)
    return now >= start && now <= end
  })
  return active?.id ?? cycles[0]?.id ?? null
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

function DashboardPage() {
  const cycleId = useStore(selectedCycleStore, (s) => s.cycleId)
  const { data: me } = useQuery(meQueryOptions())
  const { data: cycles } = useQuery(performanceCyclesQueryOptions())
  const activeCycleId = useMemo(
    () => (cycles ? getActiveCycleId(cycles, cycleId) : null),
    [cycles, cycleId],
  )
  const cycle = useMemo(
    () => cycles?.find((c) => c.id === activeCycleId) ?? null,
    [cycles, activeCycleId],
  )

  useEffect(() => {
    if (cycles?.length && activeCycleId != null && cycleId === null) {
      setSelectedCycleId(activeCycleId)
    }
  }, [cycles, activeCycleId, cycleId])

  const { data: objectivesData } = useQuery({
    ...objectivesQueryOptions({
      user_id: me?.user.id,
      performance_cycle_id: activeCycleId ?? undefined,
      limit: 6,
    }),
    enabled: !!me?.user.id && !!activeCycleId,
  })
  const objectives = objectivesData?.items ?? []

  const scoreResults = useQueries({
    queries: objectives.map((o) =>
      objectiveScoreByObjectiveQueryOptions(o.id),
    ),
  })
  const scoresByObjectiveId = useMemo(() => {
    const map: Record<string, { achievement: string; weighted: string }> = {}
    objectives.forEach((o, i) => {
      const score = scoreResults[i]?.data
      if (score)
        map[o.id] = {
          achievement: score.achievement_percentage,
          weighted: score.weighted_score,
        }
    })
    return map
  }, [objectives, scoreResults])

  const { data: summary } = useQuery({
    ...performanceSummaryByUserCycleQueryOptions(
      me?.user.id ?? '',
      activeCycleId ?? '',
    ),
    enabled: !!me?.user.id && !!activeCycleId,
  })

  const { data: auditLogs } = useQuery({
    ...auditLogsRecentQueryOptions('objective', 10),
  })

  const weekProgress = cycle ? cycleWeekProgress(cycle) : null

  const weightPct = (obj: { weight: string }) =>
    Number(obj.weight) <= 1 && Number(obj.weight) > 0
      ? Math.round(Number(obj.weight) * 100)
      : Number(obj.weight)

  return (
    <div className="space-y-6">
      {/* Header row: title + cycle selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {cycle?.name ?? 'this cycle'}
          </p>
        </div>
        <select
          value={activeCycleId ?? ''}
          onChange={(e) =>
            setSelectedCycleId(e.target.value ? e.target.value : null)
          }
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {cycles?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          {(!cycles?.length || !activeCycleId) && (
            <option value="">Select cycle</option>
          )}
        </select>
      </div>

      {/* Cycle progress bar — only when active cycle exists */}
      {cycle && weekProgress && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="relative mb-2 flex items-center justify-between text-xs text-stone-500">
            <span>{weekProgress.startLabel}</span>
            <span className="absolute left-1/2 -translate-x-1/2 font-medium text-amber-700">
              Week {weekProgress.currentWeek} of {weekProgress.totalWeeks}
            </span>
            <span>{weekProgress.endLabel}</span>
          </div>
          <div className="relative h-2 w-full overflow-visible rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
              style={{ width: `${weekProgress.progressPct}%` }}
            />
            {weekProgress.lockPositionPct != null &&
              weekProgress.lockLabel != null && (
                <span
                  className="absolute top-1/2 z-10 -translate-y-1/2"
                  style={{ left: `${weekProgress.lockPositionPct}%` }}
                  title={weekProgress.lockLabel}
                >
                  <span
                    className="block h-3 w-0.5 rounded-full bg-stone-600"
                    aria-hidden
                  />
                </span>
              )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (col-span-2): objectives summary + performance summary */}
        <div className="space-y-6 lg:col-span-2">
          {/* Objectives summary card */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-900">
              Objectives summary
            </h2>
            {cycle?.objectives_locked_at && (
              <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Objectives are locked for this cycle.
              </div>
            )}
            {!activeCycleId && (
              <p className="mt-3 text-sm text-stone-500">
                Select a cycle to see objectives.
              </p>
            )}
            {objectives.length === 0 && !!me?.user.id && !!activeCycleId && (
              <p className="mt-3 text-sm text-stone-500">
                No objectives in this cycle. Add your first objective.
              </p>
            )}
            {objectives.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-stone-200">
                <table className="w-full min-w-0 text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80">
                      <th className="px-3 py-2 text-left font-medium text-stone-700">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-stone-700">
                        Weight%
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-stone-700">
                        Progress
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-stone-700">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {objectives.map((obj) => {
                      const score = scoresByObjectiveId[obj.id]
                      const achievement = score
                        ? Math.min(100, Number(score.achievement))
                        : 0
                      return (
                        <tr key={obj.id} className="hover:bg-stone-50/50">
                          <td className="px-3 py-2">
                            <Link
                              to="/objectives/$id"
                              params={{ id: obj.id }}
                              className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                            >
                              {obj.title}
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(obj.status)}`}
                            >
                              {obj.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {weightPct(obj)}%
                          </td>
                          <td className="px-3 py-2">
                            <div className="h-1.5 w-20 min-w-[5rem] overflow-hidden rounded-full bg-stone-100">
                              <div
                                className="h-full rounded-full bg-amber-500/70"
                                style={{ width: `${achievement}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-stone-700">
                            {score ? `${score.achievement}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {objectives.length > 0 && (
              <Link
                to="/objectives"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                View all objectives
                <ArrowRight className="size-4" />
              </Link>
            )}
          </section>

          {/* Performance summary card — only when summary exists */}
          {summary && (
            <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-900">
                Performance summary
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-stone-50/80 p-3">
                  <p className="text-xs text-stone-500">Quantitative score</p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {summary.quantitative_score ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-stone-50/80 p-3">
                  <p className="text-xs text-stone-500">Behavioral score</p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {summary.behavioral_score ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-stone-50/80 p-3">
                  <p className="text-xs text-stone-500">Final weighted score</p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {summary.final_weighted_score ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-stone-50/80 p-3">
                  <p className="text-xs text-stone-500">Rating band</p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {summary.final_rating_band ?? '—'}
                  </p>
                </div>
              </div>
              {(summary.manager_comment || summary.employee_comment) && (
                <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                  {summary.manager_comment && (
                    <p className="text-sm text-stone-600">
                      <span className="font-medium text-stone-700">
                        Manager:
                      </span>{' '}
                      {summary.manager_comment}
                    </p>
                  )}
                  {summary.employee_comment && (
                    <p className="text-sm text-stone-600">
                      <span className="font-medium text-stone-700">
                        Employee:
                      </span>{' '}
                      {summary.employee_comment}
                    </p>
                  )}
                </div>
              )}
              {summary.hr_approved && (
                <p className="mt-3 inline-flex rounded px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100">
                  HR approved
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right column: score ring + recent activity */}
        <div className="space-y-6">
          {/* Score ring / gauge */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-4xl font-bold tabular-nums text-stone-900">
                {summary?.final_weighted_score ?? '—'}
              </span>
              <span className="mt-1 text-sm text-stone-500">
                {summary?.final_rating_band ?? 'No rating yet'}
              </span>
            </div>
          </section>

          {/* Recent activity feed */}
          <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-stone-900">
                Recent activity
              </h2>
            </div>
            <div className="max-h-64 overflow-auto">
              {!auditLogs?.length && (
                <div className="px-4 py-6 text-center text-sm text-stone-500">
                  No recent activity.
                </div>
              )}
              <ul className="divide-y divide-stone-100">
                {auditLogs?.map((entry) => (
                  <li key={entry.id} className="px-4 py-2.5">
                    <p className="text-sm">
                      <span className="font-semibold text-stone-900">
                        {entry.action}
                      </span>
                      <span className="ml-1 text-stone-500">
                        {entry.entity_id.slice(0, 8)}…
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {entry.changed_at
                        ? format(parseISO(entry.changed_at), 'MMM d, HH:mm')
                        : '—'}
                      {entry.changed_by && ` · ${entry.changed_by}`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
