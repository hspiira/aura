'use client'

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Calendar,
  ChevronDown,
  Hash,
  Lock,
  Repeat,
  SquareArrowOutUpRight,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'
import { format, parseISO } from 'date-fns'
import { TablePagination } from '#/components/ui/table-pagination'

export interface MainCycleTableRow {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  review_frequency: string | null
  objectives_lock_date: string | null
  objectives_locked_at: string | null
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600 border-stone-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-stone-200 text-stone-500 border-stone-300',
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

export interface MainCycleTableProps {
  data: MainCycleTableRow[]
  isPending?: boolean
  className?: string
}

export function MainCycleTable({
  data,
  isPending = false,
  className,
}: MainCycleTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = data.length
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  const displayData = data.slice(start, start + pageSize)

  const goToPage = (p: number) => {
    setPage(p)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div
      className={cn(
        'w-full overflow-hidden border border-stone-200 bg-white',
        className,
      )}
    >
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="border-stone-200 bg-stone-50/80 hover:bg-stone-50/80">
            <TableHead className="h-9 min-w-[180px] border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Name</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center border border-stone-300 bg-white text-stone-500">
                  <Hash className="size-3" />
                </span>
                <span className="text-xs font-semibold text-stone-700">Cycle ID</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Dates</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Status</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Repeat className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Review</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Lock date</span>
              </div>
            </TableHead>
            <TableHead className="h-9 w-10 px-3 py-1.5">
              <span className="sr-only">View</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && (
            <TableRow className="border-stone-200 bg-white">
              <TableCell
                colSpan={7}
                className="border-r border-stone-200 py-8 text-center text-sm text-stone-500"
              >
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!isPending && data.length === 0 && (
            <TableRow className="border-stone-200 bg-white">
              <TableCell
                colSpan={7}
                className="border-r border-stone-200 py-8 text-center text-sm text-stone-400"
              >
                No cycles yet.
              </TableCell>
            </TableRow>
          )}
          {!isPending &&
            displayData.map((cycle) => {
              const statusClass =
                STATUS_BADGE[cycle.status.toLowerCase()] ??
                'bg-stone-100 text-stone-600 border-stone-200'
              return (
                <TableRow
                  key={cycle.id}
                  className="border-stone-200 bg-white hover:bg-stone-50/50"
                >
                  <TableCell className="min-w-[180px] border-r border-stone-200 px-3 py-1.5">
                    <Link
                      to="/cycles/$id"
                      params={{ id: cycle.id }}
                      className="font-medium text-stone-900 hover:text-amber-700"
                    >
                      {cycle.name}
                    </Link>
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5 font-mono text-xs text-stone-600">
                    {cycle.id}
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {format(parseISO(cycle.start_date), 'MMM d')} –{' '}
                      {format(parseISO(cycle.end_date), 'MMM d')}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5">
                    <Pill className={statusClass}>{cycle.status}</Pill>
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                    {cycle.review_frequency ?? '—'}
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                    {cycle.objectives_lock_date ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="size-3.5" />
                        {format(
                          parseISO(cycle.objectives_lock_date),
                          'MMM d',
                        )}
                      </span>
                    ) : cycle.objectives_locked_at ? (
                      <span className="inline-flex items-center gap-1 text-stone-500">
                        <Lock className="size-3.5" />
                        Locked
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="w-10 px-3 py-1.5">
                    <Link
                      to="/cycles/$id"
                      params={{ id: cycle.id }}
                      className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                      aria-label={`View ${cycle.name}`}
                    >
                      <SquareArrowOutUpRight className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
