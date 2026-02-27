import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { format, parseISO } from 'date-fns'
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  Target,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  auditLogsRecentQueryOptions,
  meQueryOptions,
  objectiveScoreByObjectiveQueryOptions,
  objectivesQueryOptions,
  performanceCyclesQueryOptions,
  performanceSummaryByUserCycleQueryOptions,
} from '#/lib/queries'
import type { ObjectiveResponse, PerformanceCycleResponse } from '#/lib/types'
import { selectedCycleStore } from '#/stores/selected-cycle'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function cycleWeekProgress(cycle: PerformanceCycleResponse): {
  currentWeek: number
  totalWeeks: number
  progressPct: number
  startLabel: string
  endLabel: string
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
  return {
    currentWeek,
    totalWeeks,
    progressPct,
    startLabel: format(start, 'MMM d'),
    endLabel: format(end, 'MMM d'),
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

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  active: 'bg-emerald-100 text-emerald-700',
  review: 'bg-amber-100 text-amber-700',
  at_risk: 'bg-red-100 text-red-600',
  complete: 'bg-stone-100 text-stone-500',
  locked: 'bg-stone-200 text-stone-600',
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

  const { data: objectivesData } = useQuery({
    ...objectivesQueryOptions({
      user_id: me?.user.id,
      performance_cycle_id: activeCycleId ?? undefined,
      limit: 50,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-stone-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Overview for {cycle?.name ?? 'this cycle'}
        </p>
      </div>

      {/* Current cycle progress bar */}
      {cycle && weekProgress && (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex justify-between text-xs text-stone-500">
            <span>{weekProgress.startLabel}</span>
            <span className="font-medium text-amber-700">
              Week {weekProgress.currentWeek} of {weekProgress.totalWeeks}
            </span>
            <span>{weekProgress.endLabel}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
              style={{ width: `${weekProgress.progressPct}%` }}
            />
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: objectives + quick actions */}
        <div className="space-y-6 lg:col-span-2">
          {/* My objectives summary */}
          <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-stone-900">
                My objectives
              </h2>
            </div>
            <div className="divide-y divide-stone-100">
              {objectives.length === 0 && !me?.user.id && (
                <div className="px-4 py-6 text-center text-sm text-stone-500">
                  Select a cycle to see objectives.
                </div>
              )}
              {objectives.length === 0 && me?.user.id && (
                <div className="px-4 py-6 text-center text-sm text-stone-500">
                  No objectives for this cycle.
                </div>
              )}
              {objectives.map((obj) => {
                const score = scoresByObjectiveId[obj.id]
                const statusClass =
                  STATUS_BADGE[obj.status.toLowerCase()] ??
                  'bg-stone-100 text-stone-600'
                return (
                  <div
                    key={obj.id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {obj.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${statusClass}`}
                        >
                          {obj.status}
                        </span>
                        <span className="text-xs text-stone-400">
                          Weight{' '}
                          {Number(obj.weight) <= 1 && Number(obj.weight) > 0
                            ? Math.round(Number(obj.weight) * 100)
                            : Number(obj.weight)}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      {score ? (
                        <span className="text-sm font-medium text-stone-700">
                          {score.achievement}%
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </div>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-amber-500/70"
                        style={{
                          width: `${score ? Math.min(100, Number(score.achievement)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Quick actions */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Quick actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/objectives"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <ClipboardList className="size-4" />
                Add objective update
              </Link>
              <Link
                to="/calibration"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <FileText className="size-4" />
                View review session
              </Link>
              <Link
                to="/objectives"
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                <Target className="size-4" />
                My objectives
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right: score card + audit feed */}
        <div className="space-y-6">
          {/* Overall score card */}
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <BarChart3 className="size-4" />
              Overall score
            </h2>
            {summary ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Quantitative</span>
                  <span className="font-medium text-stone-800">
                    {summary.quantitative_score ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Behavioral</span>
                  <span className="font-medium text-stone-800">
                    {summary.behavioral_score ?? '—'}
                  </span>
                </div>
                <div className="border-t border-stone-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-stone-700">
                      Final weighted
                    </span>
                    <span className="text-lg font-semibold text-stone-900">
                      {summary.final_weighted_score ?? '—'}
                    </span>
                  </div>
                  {summary.final_rating_band && (
                    <p className="mt-1 text-xs text-stone-500">
                      Band: {summary.final_rating_band}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                No summary for this cycle yet.
              </p>
            )}
          </section>

          {/* Recent audit activity */}
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
              <ul className="divide-y divide-stone-50">
                {auditLogs?.map((entry) => (
                  <li key={entry.id} className="px-4 py-2.5">
                    <p className="text-xs font-medium text-stone-700">
                      {entry.action}
                      <span className="ml-1 font-normal text-stone-500">
                        · {entry.entity_type} {entry.entity_id.slice(0, 8)}…
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {format(parseISO(entry.changed_at), 'MMM d, HH:mm')}
                      {entry.changed_by && ` · by ${entry.changed_by}`}
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
