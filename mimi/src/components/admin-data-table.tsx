'use client'

import * as React from 'react'
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
import { TablePagination } from '#/components/ui/table-pagination'
import { cn } from '#/lib/utils'

export interface AdminDataTableColumn<T> {
  id: string
  /** Optional icon for the header (e.g. Lucide icon). Shown in the standard table header style. */
  icon?: React.ReactNode
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
    <TableContainer className={className}>
      <Table className="text-sm">
        <TableHeader>
          <TableHeaderRow>
            {columns.map((col, i) => (
              <TableHead
                key={col.id}
                icon={col.icon}
                className={cn(
                  i === columns.length - 1 && 'border-r-0',
                  col.className,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
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
              <TableRow key={index}>
                {columns.map((col, i) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      i === columns.length - 1 && 'border-r-0',
                      col.className,
                    )}
                  >
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
    </TableContainer>
  )
}

