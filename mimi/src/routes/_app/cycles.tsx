import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  ArrowRight,
  Calendar,
  CircleDot,
  FileText,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '#/components/ui/table'
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

          <TableContainer>
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableHeaderRow>
                  <TableHead icon={<FileText className="size-3" />}>
                    Name
                  </TableHead>
                  <TableHead icon={<Calendar className="size-3" />}>
                    Dates
                  </TableHead>
                  <TableHead icon={<CircleDot className="size-3" />}>
                    Status
                  </TableHead>
                  <TableHead icon={<RefreshCw className="size-3" />}>
                    Review frequency
                  </TableHead>
                  <TableHead icon={<Lock className="size-3" />}>
                    Lock date
                  </TableHead>
                  <TableHead
                    className="w-20 border-r-0 text-right"
                    icon={<ArrowRight className="size-3" />}
                  >
                    Actions
                  </TableHead>
                </TableHeaderRow>
              </TableHeader>
              <TableBody>
                {isPending && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="border-r-0 py-8 text-center text-stone-500"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!isPending && sortedCycles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="border-r-0 py-8 text-center text-sm text-stone-500"
                    >
                      No cycles yet. Create one in{' '}
                      <Link
                        to="/admin/cycles"
                        className="font-medium text-amber-700 hover:text-amber-800"
                      >
                        Admin → Cycles
                      </Link>
                      .
                    </TableCell>
                  </TableRow>
                )}
                {!isPending &&
                  sortedCycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell>
                        <Link
                          to="/cycles/$id"
                          params={{ id: cycle.id }}
                          className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                        >
                          {cycle.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {format(parseISO(cycle.start_date), 'MMM d')} –{' '}
                        {format(parseISO(cycle.end_date), 'MMM d')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(cycle.status)}`}
                        >
                          {cycle.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {cycle.review_frequency ?? '—'}
                      </TableCell>
                      <TableCell className="text-stone-600">
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
                      </TableCell>
                      <TableCell className="border-r-0 text-right">
                        <Link
                          to="/cycles/$id"
                          params={{ id: cycle.id }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          View
                          <ArrowRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      <Outlet />
    </div>
  )
}
