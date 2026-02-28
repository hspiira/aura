'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '#/lib/utils'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  className?: string
  pageSizeOptions?: readonly number[]
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, total)

  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size)
  }

  const goToPage = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalPages))
    onPageChange(clamped)
  }

  const showPagination = total > pageSize || total > 0

  if (!showPagination) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-stone-50/50 px-3 py-2',
        className,
      )}
    >
      <div className="flex items-center gap-3 text-xs text-stone-600">
        <span>
          Showing {total === 0 ? 0 : start + 1}–{end} of {total}
        </span>
        <label className="flex items-center gap-1.5">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-stone-200 bg-white px-2 py-1 text-stone-800"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="flex items-center justify-center border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[5rem] px-2 text-center text-xs text-stone-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center justify-center border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

