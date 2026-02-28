import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueries, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Lock, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  meQueryOptions,
  mutations,
  objectiveScoreByObjectiveQueryOptions,
  objectivesQueryOptions,
  performanceCycleDetailQueryOptions,
  performanceDimensionsQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import { APPROVE_OBJECTIVES, hasPermission } from '#/lib/permissions'

export const Route = createFileRoute('/_app/cycles/$id')({
  component: CycleDetailPage,
})

const STATUS_ORDER_SPEC = [
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

function weightAsNumber(weight: string): number {
  const n = Number(weight)
  return n <= 1 && n > 0 ? n * 100 : n
}

function CycleDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [dimensionFilter, setDimensionFilter] = useState('')
  const [titleSearch, setTitleSearch] = useState('')

  const { data: cycle, isPending: cyclePending } = useQuery(
    performanceCycleDetailQueryOptions(id),
  )
  const { data: objectivesData } = useQuery(
    objectivesQueryOptions({
      performance_cycle_id: id,
      limit: 500,
    }),
  )
  const { data: me } = useQuery(meQueryOptions())
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 1000 }))
  const { data: dimensions } = useQuery(performanceDimensionsQueryOptions())

  const objectives = objectivesData?.items ?? []
  const users = usersData?.items ?? []
  const userNameById = useMemo(
    () => new Map(users.map((u) => [u.id, u.name])),
    [users],
  )
  const dimensionNameById = useMemo(
    () => new Map(dimensions?.map((d) => [d.id, d.name]) ?? []),
    [dimensions],
  )

  const scoreQueries = useQueries({
    queries: objectives.map((o) => objectiveScoreByObjectiveQueryOptions(o.id)),
  })
  const achievementByObjId = useMemo(() => {
    const m: Record<string, string> = {}
    objectives.forEach((o, i) => {
      const d = scoreQueries[i]?.data
      if (d) m[o.id] = d.achievement_percentage
    })
    return m
  }, [objectives, scoreQueries])

  const filteredObjectives = useMemo(() => {
    return objectives.filter((o) => {
      if (statusFilter && o.status.toLowerCase() !== statusFilter) return false
      if (dimensionFilter && o.dimension_id !== dimensionFilter) return false
      if (
        titleSearch &&
        !o.title.toLowerCase().includes(titleSearch.toLowerCase())
      )
        return false
      return true
    })
  }, [objectives, statusFilter, dimensionFilter, titleSearch])

  const lockMutation = useMutation({
    mutationFn: (objectiveId: string) => mutations.objectives.lock(objectiveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles', id] })
    },
  })

  const lockAllMutation = useMutation({
    mutationFn: async (objectiveIds: string[]) => {
      for (const objId of objectiveIds) {
        await mutations.objectives.lock(objId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles', id] })
    },
  })

  const canLock = hasPermission(me?.permissions ?? [], APPROVE_OBJECTIVES)
  const unlockableObjectives = objectives.filter(
    (o) => !o.locked_at && !o.already_locked,
  )
  const lockedCount = objectives.filter(
    (o) => !!o.locked_at || !!o.already_locked,
  ).length

  if (cyclePending || !cycle) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500">Loading…</p>
      </div>
    )
  }

  const totalWeight = objectives.reduce(
    (sum, o) => sum + weightAsNumber(o.weight),
    0,
  )
  const totalWeightRounded = Math.round(totalWeight)
  const weightFlag = objectives.length > 0 && totalWeightRounded !== 100

  const byStatus: Record<string, number> = {}
  objectives.forEach((o) => {
    const s = o.status.toLowerCase()
    byStatus[s] = (byStatus[s] ?? 0) + 1
  })
  const statusEntries = Object.entries(byStatus).sort(
    ([a], [b]) =>
      STATUS_ORDER_SPEC.indexOf(a) - STATUS_ORDER_SPEC.indexOf(b),
  )

  const scoredAchievements = objectives
    .map((o) => achievementByObjId[o.id])
    .filter((pct): pct is string => pct != null && pct !== '')
  const avgAchievement =
    scoredAchievements.length > 0
      ? scoredAchievements.reduce((s, p) => s + Number(p), 0) /
        scoredAchievements.length
      : null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/cycles"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" />
          Back to cycles
        </Link>
        {canLock && unlockableObjectives.length > 0 && (
          <button
            type="button"
            onClick={() =>
              lockAllMutation.mutate(unlockableObjectives.map((o) => o.id))
            }
            disabled={lockAllMutation.isPending}
            className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            <Lock className="size-4" />
            Lock all unlocked ({unlockableObjectives.length})
          </button>
        )}
      </div>

      {/* Header card */}
      <section className="border border-stone-200 bg-white p-4">
        <h1 className="text-lg font-semibold text-stone-900">{cycle.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <span>
            {format(parseISO(cycle.start_date), 'MMM d')} –{' '}
            {format(parseISO(cycle.end_date), 'MMM d')}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(cycle.status)}`}
          >
            {cycle.status}
          </span>
          {cycle.review_frequency && (
            <span>Review: {cycle.review_frequency}</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">
          {cycle.objectives_lock_date && (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3.5" />
              Lock date: {format(parseISO(cycle.objectives_lock_date), 'MMM d')}
            </span>
          )}
          {cycle.objectives_locked_at && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Lock className="size-3.5" />
              Locked at{' '}
              {format(parseISO(cycle.objectives_locked_at), 'MMM d HH:mm')}
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Objectives section (col-span-2) */}
        <div className="space-y-4 lg:col-span-2">
          <section className="border border-stone-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Target className="size-4" />
              Objectives
            </h2>

            {/* Filter bar */}
            <div className="mb-4 flex flex-wrap gap-3 border border-stone-200 bg-white p-3">
              <input
                type="search"
                placeholder="Search by title…"
                value={titleSearch}
                onChange={(e) => setTitleSearch(e.target.value)}
                className="border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700"
              >
                <option value="">All statuses</option>
                {STATUS_ORDER_SPEC.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <select
                value={dimensionFilter}
                onChange={(e) => setDimensionFilter(e.target.value)}
                className="border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700"
              >
                <option value="">All dimensions</option>
                {dimensions?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredObjectives.length === 0 ? (
              <p className="text-sm text-stone-500">
                No objectives in this cycle.
              </p>
            ) : (
              <div className="overflow-hidden border border-stone-200">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80">
                      <th className="px-4 py-3 text-left font-semibold text-stone-700">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700">
                        Dimension
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-stone-700">
                        Weight%
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700">
                        Locked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredObjectives.map((obj) => {
                      const locked = !!obj.locked_at || !!obj.already_locked
                      return (
                        <tr
                          key={obj.id}
                          className="hover:bg-stone-50/50"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to="/objectives/$id"
                              params={{ id: obj.id }}
                              className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                            >
                              {obj.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {userNameById.get(obj.user_id) ?? obj.user_id}
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {dimensionNameById.get(obj.dimension_id) ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(obj.status)}`}
                            >
                              {obj.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-stone-600">
                            {weightDisplay(obj.weight)}
                          </td>
                          <td className="px-4 py-3">
                            {locked ? (
                              <span className="inline-flex items-center gap-1 text-stone-500">
                                <Lock className="size-3.5" />
                                Locked
                              </span>
                            ) : canLock ? (
                              <button
                                type="button"
                                onClick={() => lockMutation.mutate(obj.id)}
                                disabled={lockMutation.isPending}
                                className="inline-flex items-center gap-1 border border-stone-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                              >
                                <Lock className="size-3.5" />
                                Lock
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Aggregate panel */}
        <div className="space-y-6">
          <section className="border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Aggregate
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Total objectives</dt>
                <dd className="font-medium text-stone-800">
                  {objectives.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Locked</dt>
                <dd className="font-medium text-stone-800">
                  {lockedCount} / {objectives.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Total weight</dt>
                <dd
                  className={`font-medium ${weightFlag ? 'text-red-600' : 'text-stone-800'}`}
                >
                  {objectives.length ? `${totalWeightRounded}%` : '—'}
                </dd>
              </div>
              {statusEntries.length > 0 && (
                <div className="border-t border-stone-100 pt-3">
                  <dt className="mb-1.5 text-stone-500">Status breakdown</dt>
                  <dd className="space-y-1">
                    {statusEntries.map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="capitalize text-stone-600">
                          {status.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-stone-800">
                          {count}
                        </span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-100 pt-3">
                <dt className="text-stone-500">Avg achievement %</dt>
                <dd className="font-medium text-stone-800">
                  {avgAchievement != null
                    ? `${avgAchievement.toFixed(1)}%`
                    : '—'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
