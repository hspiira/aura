import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Lock, Target } from 'lucide-react'
import {
  performanceCycleDetailQueryOptions,
  objectivesQueryOptions,
  meQueryOptions,
  mutations,
} from '#/lib/queries'

export const Route = createFileRoute('/_app/cycles/$id')({
  component: CycleDetailPage,
})

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

function CycleDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: cycle, isPending: cyclePending } = useQuery(performanceCycleDetailQueryOptions(id))
  const { data: objectivesData } = useQuery(
    objectivesQueryOptions({
      performance_cycle_id: id,
      limit: 500,
    }),
  )
  const { data: me } = useQuery(meQueryOptions())
  const objectives = objectivesData?.items ?? []

  const lockMutation = useMutation({
    mutationFn: (objectiveId: string) => mutations.objectives.lock(objectiveId),
    mutationKey: ['objectives', 'lock'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles', id] })
    },
  })

  const canLock =
    me?.permissions?.includes('approve_objectives') ?? false
  const unlockableObjectives = objectives.filter(
    (o) => o.locked_at === null && !o.already_locked,
  )
  const lockedCount = objectives.filter((o) => o.locked_at !== null || o.already_locked).length

  if (cyclePending || !cycle) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500">Loading…</p>
      </div>
    )
  }

  const byStatus: Record<string, number> = {}
  objectives.forEach((o) => {
    const s = o.status.toLowerCase()
    byStatus[s] = (byStatus[s] ?? 0) + 1
  })
  const totalWeight = objectives.reduce(
    (sum, o) => sum + (Number(o.weight) <= 1 ? Number(o.weight) * 100 : Number(o.weight)),
    0,
  )

  return (
    <div className="space-y-6">
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
            onClick={() => {
              unlockableObjectives.forEach((o) => lockMutation.mutate(o.id))
            }}
            disabled={lockMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            <Lock className="size-4" />
            Lock all objectives ({unlockableObjectives.length})
          </button>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">{cycle.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <span>
            {format(parseISO(cycle.start_date), 'MMM d')} –{' '}
            {format(parseISO(cycle.end_date), 'MMM d')}
          </span>
          <span className="rounded bg-stone-100 px-2 py-0.5 font-medium capitalize text-stone-700">
            {cycle.status}
          </span>
          {cycle.objectives_lock_date && (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3.5" />
              Lock date: {format(parseISO(cycle.objectives_lock_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Target className="size-4" />
              Objectives in this cycle ({objectives.length})
            </h2>
            {objectives.length === 0 ? (
              <p className="text-sm text-stone-500">No objectives in this cycle.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left">
                      <th className="pb-2 font-semibold text-stone-700">Title</th>
                      <th className="pb-2 font-semibold text-stone-700">Owner</th>
                      <th className="pb-2 font-semibold text-stone-700">Status</th>
                      <th className="pb-2 font-semibold text-stone-700">Weight</th>
                      <th className="pb-2 font-semibold text-stone-700">Locked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {objectives.map((obj) => (
                      <tr key={obj.id} className="hover:bg-stone-50/50">
                        <td className="py-2">
                          <Link
                            to="/objectives/$id"
                            params={{ id: obj.id }}
                            className="font-medium text-stone-900 hover:text-amber-700"
                          >
                            {obj.title}
                          </Link>
                        </td>
                        <td className="py-2 text-stone-600">{obj.user_id}</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${
                              STATUS_BADGE[obj.status.toLowerCase()] ?? 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {obj.status}
                          </span>
                        </td>
                        <td className="py-2 text-stone-600">{weightDisplay(obj.weight)}</td>
                        <td className="py-2">
                          {obj.locked_at || obj.already_locked ? (
                            <span className="text-xs text-stone-500">Locked</span>
                          ) : canLock ? (
                            <button
                              type="button"
                              onClick={() => lockMutation.mutate(obj.id)}
                              disabled={lockMutation.isPending}
                              className="text-xs text-amber-600 hover:text-amber-700"
                            >
                              Lock
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Aggregate</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Total objectives</dt>
                <dd className="font-medium text-stone-800">{objectives.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Locked</dt>
                <dd className="font-medium text-stone-800">{lockedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Total weight</dt>
                <dd className="font-medium text-stone-800">
                  {objectives.length ? `${Math.round(totalWeight)}%` : '—'}
                </dd>
              </div>
              {Object.keys(byStatus).length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <dt className="text-stone-500 mb-1">By status</dt>
                  <dd className="space-y-0.5">
                    {Object.entries(byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-xs">
                        <span className="capitalize text-stone-600">{status}</span>
                        <span className="font-medium text-stone-800">{count}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
