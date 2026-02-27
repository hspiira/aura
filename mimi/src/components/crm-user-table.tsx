/**
 * CRM User Table
 * Matches the data-grid with User, User ID, User type, and Engagement score
 * columns from the design reference.
 *
 * Subcomponents:
 *   UserTypeBadge        – coloured pill for Member / Admin
 *   EngagementBadge      – coloured pill for Light / Power User / Inactive
 *   UserTableRow         – single row
 *   CrmUserTable         – full table with checkbox header + rows
 */

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'
import { TablePagination } from '#/components/ui/table-pagination'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserType = 'Member' | 'Admin'
export type EngagementScore = 'Light' | 'Power User' | 'Inactive'

export interface CrmUser {
  id: string
  /** Display ID shown in the table (truncated) */
  displayId: string
  name: string
  avatarUrl?: string
  initials: string
  userType: UserType
  engagementScore: EngagementScore
}

export interface CrmUserTableProps {
  users: CrmUser[]
  className?: string
}

// ─── Badge variants ───────────────────────────────────────────────────────────

const USER_TYPE_STYLES: Record<UserType, string> = {
  Member:
    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Admin:
    'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
}

const ENGAGEMENT_STYLES: Record<EngagementScore, string> = {
  Light:
    'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Power User':
    'bg-purple-100 text-purple-800 ring-1 ring-purple-300',
  Inactive:
    'bg-sky-50 text-sky-600 ring-1 ring-sky-200',
}

function UserTypeBadge({ type }: { type: UserType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        USER_TYPE_STYLES[type],
      )}
    >
      {type}
    </span>
  )
}

function EngagementBadge({ score }: { score: EngagementScore }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ENGAGEMENT_STYLES[score],
      )}
    >
      {score}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CrmUserTable({ users, className }: CrmUserTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const total = users.length
  const start = (page - 1) * pageSize
  const displayUsers = users.slice(start, start + pageSize)

  const allSelected = displayUsers.length > 0 && selected.size === displayUsers.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(displayUsers.map((u) => u.id)))
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function goToPage(nextPage: number) {
    setPage(nextPage)
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm',
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-stone-200 bg-stone-50 hover:bg-stone-50">
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
            </TableHead>
            <TableHead className="text-xs font-semibold text-stone-500">
              User
            </TableHead>
            <TableHead className="text-xs font-semibold text-stone-500">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-3.5 rounded-sm bg-stone-300/60" />
                User ID
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-stone-500">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-3.5 rounded-sm bg-stone-300/60" />
                User type
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-stone-500">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-3.5 rounded-sm bg-stone-300/60" />
                Engagement score
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayUsers.map((user) => {
            const isSelected = selected.has(user.id)
            return (
              <TableRow
                key={user.id}
                data-selected={isSelected}
                className={cn(
                  'border-stone-100 transition-colors',
                  isSelected && 'bg-stone-50',
                )}
              >
                {/* Checkbox */}
                <TableCell className="w-10 pl-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(user.id)}
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>

                {/* User */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm" className="shrink-0">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-stone-900">
                      {user.name}
                    </span>
                  </div>
                </TableCell>

                {/* User ID */}
                <TableCell>
                  <span className="font-mono text-xs text-stone-500">
                    {user.displayId}
                  </span>
                </TableCell>

                {/* User type */}
                <TableCell>
                  <UserTypeBadge type={user.userType} />
                </TableCell>

                {/* Engagement score */}
                <TableCell>
                  <EngagementBadge score={user.engagementScore} />
                </TableCell>
              </TableRow>
            )
          })}

          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-stone-400"
              >
                No users found.
              </TableCell>
            </TableRow>
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

// ─── Demo wrapper ─────────────────────────────────────────────────────────────

const DEMO_USERS: CrmUser[] = [
  {
    id: '6s59-027f-4C54-98a3-3af0b00a',
    displayId: '6s59-027f-4C54-98a3-3af0b00a',
    name: 'Albert Lund',
    initials: 'AL',
    userType: 'Member',
    engagementScore: 'Light',
  },
  {
    id: '2d77-027f-5B23-96V9-3D9ed00a',
    displayId: '2d77-027f-5B23-96V9-3D9ed00a',
    name: 'Jenna Roberts',
    initials: 'JR',
    userType: 'Admin',
    engagementScore: 'Light',
  },
  {
    id: '1dj0-d7dd-5090-ab709-5912b027',
    displayId: '1dj0-d7dd-5090-ab709-5912b027',
    name: 'David Chen',
    initials: 'DC',
    userType: 'Admin',
    engagementScore: 'Power User',
  },
  {
    id: '9bc0-3abd-8990-dj36-7698b022',
    displayId: '9bc0-3abd-8990-dj36-7698b022',
    name: 'Marc Lopez',
    initials: 'ML',
    userType: 'Member',
    engagementScore: 'Inactive',
  },
]

export function CrmUserTableDemo() {
  return (
    <div className="rounded-2xl bg-stone-100/80 p-6 md:p-10">
      <p className="mb-6 text-center">
        <span className="rounded-full bg-stone-300/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-600">
          CRM – User Table
        </span>
      </p>
      <CrmUserTable users={DEMO_USERS} className="mx-auto max-w-3xl" />
    </div>
  )
}
