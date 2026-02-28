import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  objectiveScoreByObjectiveQueryOptions,
  objectivesQueryOptions,
  performanceCyclesQueryOptions,
  performanceDimensionsQueryOptions,
} from '#/lib/queries'
import { EDIT_OBJECTIVES, hasPermission } from '#/lib/permissions'
import { useStore } from '@tanstack/react-store'
import { selectedCycleStore, setSelectedCycleId } from '#/stores/selected-cycle'
import { meQueryOptions } from '#/lib/queries'
import { Lock, Plus } from 'lucide-react'
import { NewObjectiveModal } from '#/components/objectives/NewObjectiveModal'

export const Route = createFileRoute('/_app/objectives')({
  component: ObjectivesPage,
})

const STATUS_OPTIONS = [
  'draft',
  'submitted',
  'approved',
  'active',
  'under_review',
  'at_risk',
  'completed',
  'rejected',
  'closed',
] as const

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

function ObjectivesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isListPage = pathname === '/objectives'

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dimensionFilter, setDimensionFilter] = useState<string>('')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const cycleId = useStore(selectedCycleStore, (s) => s.cycleId)
  const { data: me } = useQuery(meQueryOptions())
  const { data: cycles } = useQuery(performanceCyclesQueryOptions())
  const { data: dimensions } = useQuery(performanceDimensionsQueryOptions())
  const effectiveCycleId = cycleId ?? cycles?.[0]?.id ?? ''
  const selectedCycle = useMemo(
    () => cycles?.find((c) => c.id === effectiveCycleId) ?? null,
    [cycles, effectiveCycleId],
  )
  const objectivesLocked = !!selectedCycle?.objectives_locked_at
  const canEdit = hasPermission(me?.permissions ?? [], EDIT_OBJECTIVES)

  const { data: objectivesData } = useQuery({
    ...objectivesQueryOptions({
      user_id: me?.user.id,
      performance_cycle_id: effectiveCycleId || undefined,
      status: statusFilter || undefined,
      dimension_id: dimensionFilter || undefined,
      limit: 100,
    }),
    enabled: !!me?.user.id,
  })
  const objectives = objectivesData?.items ?? []

  const scoreResults = useQueries({
    queries: objectives.map((o) => objectiveScoreByObjectiveQueryOptions(o.id)),
  })
  const scoreByObjId: Record<string, string> = {}
  const scoreLoadingByObjId: Record<string, boolean> = {}
  objectives.forEach((o, i) => {
    const r = scoreResults[i]
    if (r?.data) scoreByObjId[o.id] = r.data.achievement_percentage
    if (r?.isLoading) scoreLoadingByObjId[o.id] = true
  })

  const dimensionByName = useMemo(
    () => new Map(dimensions?.map((d) => [d.id, d.name]) ?? []),
    [dimensions],
  )

  const totalWeight = useMemo(
    () => objectives.reduce((sum, o) => sum + weightAsNumber(o.weight), 0),
    [objectives],
  )
  const hasActiveObjective = objectives.some(
    (o) => o.status.toLowerCase() === 'active',
  )
  const weightFooterRed =
    totalWeight > 100 || (totalWeight < 100 && hasActiveObjective)

  return (
    <div className="space-y-6">
      {isListPage && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-stone-900">
                Objectives
              </h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Your objectives for the selected cycle.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setNewModalOpen(true)}
                disabled={objectivesLocked}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="size-4" />
                New objective
              </button>
            )}
          </div>

          {!canEdit && (
            <p className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              You don&apos;t have permission to manage objectives.
            </p>
          )}

          {canEdit && (
            <>
              {/* Filter bar */}
              <div className="flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-white p-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500">Cycle</span>
                  <select
                    value={effectiveCycleId}
                    onChange={(e) =>
                      setSelectedCycleId(e.target.value || null)
                    }
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    {cycles?.map((c) => (
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
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <option value="">All</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500">Dimension</span>
                  <select
                    value={dimensionFilter}
                    onChange={(e) => setDimensionFilter(e.target.value)}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <option value="">All</option>
                    {dimensions?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50/80">
                        <th className="px-4 py-3 text-left font-semibold text-stone-700">
                          Title
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
                          Progress
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-stone-700">
                          Score
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-stone-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {objectives.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-stone-500"
                          >
                            No objectives match the filters.
                          </td>
                        </tr>
                      )}
                      {objectives.map((obj) => {
                        const achievement = scoreByObjId[obj.id]
                        const isLoading = scoreLoadingByObjId[obj.id]
                        const pct = achievement
                          ? Math.min(100, Number(achievement))
                          : 0
                        const locked =
                          !!obj.locked_at || !!obj.already_locked
                        const dimensionName =
                          dimensionByName.get(obj.dimension_id) ?? '—'
                        return (
                          <tr
                            key={obj.id}
                            className="hover:bg-stone-50/50"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to="/objectives/$id"
                                  params={{ id: obj.id }}
                                  className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                                >
                                  {obj.title}
                                </Link>
                                {locked && (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-stone-400"
                                    title="Locked"
                                  >
                                    <Lock className="size-3.5" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-stone-600">
                              {dimensionName}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(obj.status)}`}
                              >
                                {obj.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-stone-600">
                              {weightDisplay(obj.weight)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 min-w-[5rem] overflow-hidden rounded-full bg-stone-100">
                                  <div
                                    className="h-full rounded-full bg-amber-500/70"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-stone-500">
                                  {achievement != null
                                    ? `${achievement}%`
                                    : '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-stone-800">
                              {isLoading ? '—' : achievement ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to="/objectives/$id"
                                params={{ id: obj.id }}
                                className="text-sm font-medium text-amber-600 hover:text-amber-700"
                              >
                                View →
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Row count */}
                <div className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
                  Showing {objectives.length} objective
                  {objectives.length !== 1 ? 's' : ''}
                </div>
                {/* Weight total footer */}
                {objectives.length > 0 && (
                  <div
                    className={`border-t border-stone-100 px-4 py-2 text-sm font-medium ${weightFooterRed ? 'text-red-600' : 'text-stone-700'}`}
                  >
                    Total weight: {Math.round(totalWeight)}%
                  </div>
                )}
              </div>

              <NewObjectiveModal
                open={newModalOpen}
                onOpenChange={setNewModalOpen}
                userId={me?.user.id ?? ''}
                performanceCycleId={effectiveCycleId}
              />
            </>
          )}
        </>
      )}
      <Outlet />
    </div>
  )
}
