'use client'

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  SquareArrowOutUpRight,
  User as UserIcon,
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
import type { ReviewSessionStatus, ReviewSessionType } from '#/lib/types'
import { TablePagination } from '#/components/ui/table-pagination'

const SESSION_TYPE_LABELS: Record<ReviewSessionType, string> = {
  mid_year: 'Mid-year',
  final: 'Final',
}

const STATUS_LABELS: Record<ReviewSessionStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const typePillClass: Record<ReviewSessionType, string> = {
  mid_year: 'bg-amber-100 text-amber-800 border-amber-200',
  final: 'bg-violet-100 text-violet-800 border-violet-200',
}

const statusPillClass: Record<ReviewSessionStatus, string> = {
  scheduled: 'bg-stone-100 text-stone-700 border-stone-200',
  in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
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

export interface ReviewSessionRow {
  id: string
  user_id: string
  performance_cycle_id: string
  reviewer_id: string
  session_type: ReviewSessionType
  status: ReviewSessionStatus
  scheduled_at: string | null
  completed_at: string | null
}

export function ReviewsTable({
  data,
  userById,
  cycleById,
  pageSize: pageSizeProp = 10,
  className,
}: {
  data: ReviewSessionRow[]
  userById: Record<string, string>
  cycleById?: Record<string, string>
  pageSize?: number
  className?: string
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeProp)
  const total = data.length
  const start = (page - 1) * pageSize
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
                <UserIcon className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Employee
                </span>
              </div>
            </TableHead>
            <TableHead className="h-9 min-w-[120px] border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Cycle
                </span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Reviewer
                </span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Type</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Status
                </span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Scheduled
                </span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Completed
                </span>
              </div>
            </TableHead>
            <TableHead className="h-9 w-10 px-3 py-1.5">
              <span className="sr-only">View</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-8 text-center text-sm text-stone-400"
              >
                No review sessions.
              </TableCell>
            </TableRow>
          ) : (
            displayData.map((row) => (
              <TableRow
                key={row.id}
                className="border-stone-200 bg-white hover:bg-stone-50/50"
              >
                <TableCell className="min-w-[180px] border-r border-stone-200 px-3 py-1.5">
                  <span className="font-medium text-stone-900">
                    {userById[row.user_id] ?? row.user_id}
                  </span>
                </TableCell>
                <TableCell className="min-w-[120px] border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                  {cycleById?.[row.performance_cycle_id] ?? row.performance_cycle_id}
                </TableCell>
                <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                  {userById[row.reviewer_id] ?? row.reviewer_id}
                </TableCell>
                <TableCell className="border-r border-stone-200 px-3 py-1.5">
                  <Pill className={typePillClass[row.session_type]}>
                    {SESSION_TYPE_LABELS[row.session_type]}
                  </Pill>
                </TableCell>
                <TableCell className="border-r border-stone-200 px-3 py-1.5">
                  <Pill className={statusPillClass[row.status]}>
                    {STATUS_LABELS[row.status]}
                  </Pill>
                </TableCell>
                <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                  {row.scheduled_at
                    ? new Date(row.scheduled_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </TableCell>
                <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                  {row.completed_at
                    ? new Date(row.completed_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </TableCell>
                <TableCell className="w-10 px-3 py-1.5">
                  <Link
                    to="/reviews/$id"
                    params={{ id: row.id }}
                    className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                    aria-label={`View session ${row.id}`}
                  >
                    <SquareArrowOutUpRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
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
