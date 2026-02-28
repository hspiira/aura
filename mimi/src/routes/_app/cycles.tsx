import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Calendar, Lock } from 'lucide-react'
import { performanceCyclesQueryOptions } from '#/lib/queries'

export const Route = createFileRoute('/_app/cycles')({
  component: CyclesPage,
})

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  active: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-stone-200 text-stone-500',
}

function CyclesPage() {
  const { data: cycles = [], isPending } = useQuery(performanceCyclesQueryOptions())

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-stone-900">Performance cycles</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          View cycles and manage objectives by cycle.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Dates</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Lock date</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isPending && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!isPending && cycles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                    No cycles yet.
                  </td>
                </tr>
              )}
              {!isPending &&
                cycles.map((cycle) => {
                  const statusClass =
                    STATUS_BADGE[cycle.status.toLowerCase()] ?? 'bg-stone-100 text-stone-600'
                  return (
                    <tr key={cycle.id} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3">
                        <Link
                          to="/cycles/$id"
                          params={{ id: cycle.id }}
                          className="font-medium text-stone-900 hover:text-amber-700"
                        >
                          {cycle.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {format(parseISO(cycle.start_date), 'MMM d')} –{' '}
                          {format(parseISO(cycle.end_date), 'MMM d')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${statusClass}`}
                        >
                          {cycle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {cycle.objectives_lock_date ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="size-3.5" />
                            {format(parseISO(cycle.objectives_lock_date), 'MMM d')}
                          </span>
                        ) : cycle.objectives_locked_at ? (
                          <span className="inline-flex items-center gap-1 text-stone-500">
                            <Lock className="size-3.5" />
                            Locked
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/cycles/$id"
                          params={{ id: cycle.id }}
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
    </div>
  )
}
