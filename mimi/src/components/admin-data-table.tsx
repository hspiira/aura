'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { TablePagination } from '#/components/ui/table-pagination'
import { cn } from '#/lib/utils'

export interface AdminDataTableColumn<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  className?: string
}

export interface AdminDataTableProps<T> {
  rows: T[]
  columns: AdminDataTableColumn<T>[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  emptyMessage?: string
  className?: string
}

export function AdminDataTable<T>({
  rows,
  columns,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'No records found.',
  className,
}: AdminDataTableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm',
        className,
      )}
    >
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="border-b border-stone-200 bg-stone-50/80">
            {columns.map((col) => (
              <TableHead key={col.id} className={cn('px-4 py-3 text-left', col.className)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-stone-100">
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-sm text-stone-400"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index} className="hover:bg-stone-50/50">
                {columns.map((col) => (
                  <TableCell key={col.id} className={cn('px-4 py-3', col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

