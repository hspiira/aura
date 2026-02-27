'use client'

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronDown,
  Hash,
  SquareArrowOutUpRight,
  User as UserIcon,
} from 'lucide-react'
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

export interface MainUserTableRow {
  id: string
  name: string
  avatarSrc?: string
  userType: 'Member' | 'Admin'
  engagementScore: 'Light' | 'Power User' | 'Inactive'
}

/** Row shape for people page (variant="people") */
export interface MainUserTablePeopleRow {
  id: string
  name: string
  avatarSrc?: string
  email?: string | null
  role_id: string
  department_id: string
  supervisor_id?: string | null
}

const defaultData: MainUserTableRow[] = [
  {
    id: '6s59-027f-4C54-98a3-3af0b00a',
    name: 'Albert Lund',
    userType: 'Member',
    engagementScore: 'Light',
  },
  {
    id: '2d77-027f-5B23-96V9-3D9ed00',
    name: 'Jenna Roberts',
    userType: 'Admin',
    engagementScore: 'Light',
  },
  {
    id: '1dj0-d7dd-5090-ab709-5912b027',
    name: 'David Chen',
    userType: 'Admin',
    engagementScore: 'Power User',
  },
  {
    id: '9bc0-3abd-8990-dj36-7698b022',
    name: 'Marc Lopez',
    userType: 'Member',
    engagementScore: 'Inactive',
  },
]

const userTypePillClass: Record<MainUserTableRow['userType'], string> = {
  Member: 'bg-amber-100 text-amber-800 border-amber-200',
  Admin: 'bg-orange-100 text-orange-800 border-orange-200',
}

const engagementPillClass: Record<
  MainUserTableRow['engagementScore'],
  string
> = {
  Light: 'bg-sky-100 text-sky-800 border-sky-200',
  'Power User': 'bg-violet-100 text-violet-800 border-violet-200',
  Inactive: 'bg-cyan-100 text-cyan-800 border-cyan-200',
}

function rolePillClass(roleName: string): string {
  return /admin/i.test(roleName)
    ? 'bg-orange-100 text-orange-800 border-orange-200'
    : 'bg-amber-100 text-amber-800 border-amber-200'
}

const departmentPillClass = 'bg-stone-100 text-stone-700 border-stone-200'

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

type MainUserTableProps =
  | {
      variant?: 'default'
      data?: MainUserTableRow[]
      roleById?: never
      departmentById?: never
      pageSize?: number
      className?: string
    }
  | {
      variant: 'people'
      data: MainUserTablePeopleRow[]
      roleById: Record<string, string>
      departmentById: Record<string, string>
      supervisorById?: Record<string, string>
      page?: number
      pageSize?: number
      totalCount?: number
      onPageChange?: (page: number) => void
      onPageSizeChange?: (pageSize: number) => void
      className?: string
    }

export function MainUserTable({
  data = defaultData,
  variant = 'default',
  roleById,
  departmentById,
  supervisorById,
  pageSize: pageSizeProp = 10,
  page: controlledPage,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
}: MainUserTableProps) {
  const isPeople = variant === 'people'
  const col3Label = isPeople ? 'Role' : 'User type'
  const col4Label = isPeople ? 'Department' : 'Engagement score'

  const [clientPage, setClientPage] = useState(1)
  const [clientPageSize, setClientPageSize] = useState(pageSizeProp)

  const pageSize = isPeople ? pageSizeProp : clientPageSize
  const page = isPeople ? (controlledPage ?? 1) : clientPage
  const total = isPeople ? (totalCount ?? data.length) : data.length
  const start = (page - 1) * pageSize

  const displayData = isPeople
    ? data
    : (data as MainUserTableRow[]).slice(start, start + pageSize)

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages))
    if (isPeople) onPageChange?.(next)
    else setClientPage(next)
  }

  const handlePageSizeChange = (size: number) => {
    if (isPeople) onPageSizeChange?.(size)
    else setClientPageSize(size)
    if (!isPeople) setClientPage(1)
    else onPageChange?.(1)
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
            <TableHead className="h-9 min-w-[220px] border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  className="size-3.5 border-stone-300"
                  aria-label="Select all"
                />
                <span className="text-xs font-semibold text-stone-700">User</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center border border-stone-300 bg-white text-stone-500">
                  <Hash className="size-3" />
                </span>
                <span className="text-xs font-semibold text-stone-700">User ID</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">{col3Label}</span>
              </div>
            </TableHead>
            <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">{col4Label}</span>
              </div>
            </TableHead>
            {isPeople && (
              <>
                <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
                  <span className="text-xs font-semibold text-stone-700">Email</span>
                </TableHead>
                <TableHead className="h-9 border-r border-stone-200 px-3 py-1.5">
                  <span className="text-xs font-semibold text-stone-700">Supervisor</span>
                </TableHead>
                <TableHead className="h-9 w-10 px-3 py-1.5">
                  <span className="sr-only">View</span>
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPeople
            ? (displayData as MainUserTablePeopleRow[]).map((row) => {
                const roleName = roleById?.[row.role_id] ?? row.role_id
                const deptName = departmentById?.[row.department_id] ?? row.department_id
                const supervisorName = row.supervisor_id
                  ? supervisorById?.[row.supervisor_id] ?? row.supervisor_id
                  : null
                return (
                  <TableRow
                    key={row.id}
                    className="border-stone-200 bg-white hover:bg-stone-50/50"
                  >
                    <TableCell className="min-w-[220px] border-r border-stone-200 px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          className="size-3.5 shrink-0 border-stone-300"
                          aria-label={`Select ${row.name}`}
                        />
                        <Link
                          to="/people/$id"
                          params={{ id: row.id }}
                          className="flex min-w-0 items-center gap-2 hover:opacity-90"
                        >
                          <Avatar className="size-6 shrink-0 border border-stone-200">
                            <AvatarImage src={row.avatarSrc} alt={row.name} />
                            <AvatarFallback className="bg-stone-100 text-stone-600">
                              <UserIcon className="size-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate font-medium text-stone-900">
                            {row.name}
                          </span>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-stone-200 px-3 py-1.5 font-mono text-xs text-stone-600">
                      {row.id}
                    </TableCell>
                    <TableCell className="border-r border-stone-200 px-3 py-1.5">
                      <Pill className={rolePillClass(roleName)}>{roleName}</Pill>
                    </TableCell>
                    <TableCell className="border-r border-stone-200 px-3 py-1.5">
                      <Pill className={departmentPillClass}>{deptName}</Pill>
                    </TableCell>
                    <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                      {row.email ?? '—'}
                    </TableCell>
                    <TableCell className="border-r border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                      {supervisorName ?? '—'}
                    </TableCell>
                    <TableCell className="w-10 px-3 py-1.5">
                      <Link
                        to="/people/$id"
                        params={{ id: row.id }}
                        className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                        aria-label={`View ${row.name}`}
                      >
                        <SquareArrowOutUpRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            : (displayData as MainUserTableRow[]).map((row) => (
                <TableRow
                  key={row.id}
                  className="border-stone-200 bg-white hover:bg-stone-50/50"
                >
                  <TableCell className="min-w-[220px] border-r border-stone-200 px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="size-3.5 shrink-0 border-stone-300"
                        aria-label={`Select ${row.name}`}
                      />
                      <Avatar className="size-6 shrink-0 border border-stone-200">
                        <AvatarImage src={row.avatarSrc} alt={row.name} />
                        <AvatarFallback className="bg-stone-100 text-stone-600">
                          <UserIcon className="size-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate font-medium text-stone-900">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5 font-mono text-xs text-stone-600">
                    {row.id}
                  </TableCell>
                  <TableCell className="border-r border-stone-200 px-3 py-1.5">
                    <Pill className={userTypePillClass[row.userType]}>
                      {row.userType}
                    </Pill>
                  </TableCell>
                  <TableCell className="px-3 py-1.5">
                    <Pill className={engagementPillClass[row.engagementScore]}>
                      {row.engagementScore}
                    </Pill>
                  </TableCell>
                </TableRow>
              ))}
          {isPeople && (data as MainUserTablePeopleRow[]).length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-8 text-center text-sm text-stone-400"
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
