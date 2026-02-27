import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  objectiveScoreByObjectiveQueryOptions,
  objectivesQueryOptions,
  performanceCyclesQueryOptions,
  performanceDimensionsQueryOptions,
} from '#/lib/queries'
import { useStore } from '@tanstack/react-store'
import { selectedCycleStore, setSelectedCycleId } from '#/stores/selected-cycle'
import { meQueryOptions } from '#/lib/queries'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { NewObjectiveModal } from '#/components/objectives/NewObjectiveModal'

export const Route = createFileRoute('/_app/objectives')({
  component: ObjectivesPage,
})

const STATUS_OPTIONS = [
  'draft',
  'submitted',
  'approved',
  'active',
  'at_risk',
  'completed',
  'closed',
] as const

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  submitted: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
  approved: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  at_risk: 'bg-red-100 text-red-600',
  completed: 'bg-stone-100 text-stone-500',
  under_review: 'bg-amber-100 text-amber-700',
  closed: 'bg-stone-200 text-stone-500',
}

function weightDisplay(weight: string): string {
  const n = Number(weight)
  return n <= 1 && n > 0 ? `${Math.round(n * 100)}%` : `${weight}%`
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
  objectives.forEach((o, i) => {
    const s = scoreResults[i]?.data
    if (s) scoreByObjId[o.id] = s.achievement_percentage
  })

  return (
    <div className="space-y-4">
      {isListPage && (
      <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Objectives</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Manage objectives for the current cycle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
        >
          <Plus className="size-4" />
          New objective
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Cycle</span>
          <select
            value={effectiveCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value || null)}
            className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-sm text-stone-800"
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
            className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-sm text-stone-800"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Dimension</span>
          <select
            value={dimensionFilter}
            onChange={(e) => setDimensionFilter(e.target.value)}
            className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-sm text-stone-800"
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
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Weight</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Progress</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-700">Score</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {objectives.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                    No objectives match the filters.
                  </td>
                </tr>
              )}
              {objectives.map((obj) => {
                const achievement = scoreByObjId[obj.id]
                const pct = achievement ? Math.min(100, Number(achievement)) : 0
                const statusClass = STATUS_BADGE[obj.status.toLowerCase()] ?? 'bg-stone-100 text-stone-600'
                return (
                  <tr key={obj.id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <Link
                        to="/objectives/$id"
                        params={{ id: obj.id }}
                        className="font-medium text-stone-900 hover:text-amber-700"
                      >
                        {obj.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-stone-400">
                        {format(parseISO(obj.start_date), 'MMM d')} –{' '}
                        {format(parseISO(obj.end_date), 'MMM d')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${statusClass}`}
                      >
                        {obj.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{weightDisplay(obj.weight)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-amber-500/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-500">{achievement ?? '—'}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-800">
                      {achievement ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/objectives/$id"
                        params={{ id: obj.id }}
                        className="text-amber-600 hover:text-amber-700"
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
      </div>

      <NewObjectiveModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        userId={me?.user.id ?? ''}
        performanceCycleId={effectiveCycleId}
      />
      </>
      )}
      <Outlet />
    </div>
  )
}
