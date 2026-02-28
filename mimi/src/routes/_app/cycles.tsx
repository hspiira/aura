import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowRight, Lock } from 'lucide-react'
import { useMemo } from 'react'
import { performanceCyclesQueryOptions } from '#/lib/queries'
import type { PerformanceCycleResponse } from '#/lib/types'

export const Route = createFileRoute('/_app/cycles')({
  component: CyclesPage,
})

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'draft') return 'bg-stone-100 text-stone-600'
  if (s === 'active') return 'bg-emerald-100 text-emerald-700'
  if (s === 'closed') return 'bg-stone-200 text-stone-500'
  return 'bg-stone-100 text-stone-600'
}

function sortCycles(cycles: PerformanceCycleResponse[]): PerformanceCycleResponse[] {
  return [...cycles].sort((a, b) => {
    const aActive = a.status.toLowerCase() === 'active' ? 1 : 0
    const bActive = b.status.toLowerCase() === 'active' ? 1 : 0
    if (bActive !== aActive) return bActive - aActive
    const aStart = parseISO(a.start_date).getTime()
    const bStart = parseISO(b.start_date).getTime()
    return bStart - aStart
  })
}

function CyclesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isListPage = pathname === '/cycles'

  const { data: cycles = [], isPending } = useQuery(
    performanceCyclesQueryOptions(),
  )
  const sortedCycles = useMemo(() => sortCycles(cycles), [cycles])

  return (
    <div className="space-y-6">
      {isListPage && (
        <>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">
              Performance cycles
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">
              Overview of all performance cycles; open one to manage its
              objectives.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80">
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Review frequency
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Lock date
                    </th>
                    <th className="w-20 px-4 py-3 text-right font-semibold text-stone-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isPending && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-stone-500"
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!isPending && sortedCycles.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-stone-500"
                      >
                        No cycles yet. Create one in{' '}
                        <Link
                          to="/admin/cycles"
                          className="font-medium text-amber-700 hover:text-amber-800"
                        >
                          Admin → Cycles
                        </Link>
                        .
                      </td>
                    </tr>
                  )}
                  {!isPending &&
                    sortedCycles.map((cycle) => (
                      <tr
                        key={cycle.id}
                        className="hover:bg-stone-50/50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to="/cycles/$id"
                            params={{ id: cycle.id }}
                            className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                          >
                            {cycle.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {format(parseISO(cycle.start_date), 'MMM d')} –{' '}
                          {format(parseISO(cycle.end_date), 'MMM d')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(cycle.status)}`}
                          >
                            {cycle.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {cycle.review_frequency ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {cycle.objectives_locked_at ? (
                            <span className="inline-flex items-center gap-1 text-stone-500">
                              <Lock className="size-3.5" />
                              Locked
                            </span>
                          ) : cycle.objectives_lock_date ? (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="size-3.5" />
                              {format(
                                parseISO(cycle.objectives_lock_date),
                                'MMM d',
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/cycles/$id"
                            params={{ id: cycle.id }}
                            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                          >
                            View
                            <ArrowRight className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <Outlet />
    </div>
  )
}
