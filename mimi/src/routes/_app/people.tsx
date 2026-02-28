import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Mail,
  Shield,
  User,
  UserCheck,
} from 'lucide-react'
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
import {
  departmentsQueryOptions,
  rolesQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2)
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
  return name.slice(0, 2).toUpperCase() || '?'
}

export const Route = createFileRoute('/_app/people')({
  component: PeoplePage,
})

function PeoplePage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isListPage = pathname === '/people'

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const { data: usersData } = useQuery(
    usersQueryOptions({ limit: 2000, offset: 0 }),
  )
  const { data: rolesData } = useQuery(rolesQueryOptions())
  const { data: departmentsData } = useQuery(departmentsQueryOptions())

  const allUsers = usersData?.items ?? []
  const roles = rolesData ?? []
  const departments = departmentsData ?? []

  const roleById = useMemo(
    () => new Map(roles.map((r) => [r.id, r.name])),
    [roles],
  )
  const departmentById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )
  const userNameById = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u.name])),
    [allUsers],
  )

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers
    const q = search.trim().toLowerCase()
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q),
    )
  }, [allUsers, search])

  const totalFiltered = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, totalFiltered)
  const pageUsers = useMemo(
    () => filteredUsers.slice(start, end),
    [filteredUsers, start, end],
  )

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {isListPage && (
        <>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">People</h1>
            <p className="mt-0.5 text-sm text-stone-500">
              Users, roles, and departments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 border border-stone-200 bg-white p-3">
            <input
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="min-w-[200px] border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <TableContainer>
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableHeaderRow>
                  <TableHead icon={<User className="size-3" />}>User</TableHead>
                  <TableHead icon={<Mail className="size-3" />}>Email</TableHead>
                  <TableHead icon={<Shield className="size-3" />}>Role</TableHead>
                  <TableHead icon={<Building2 className="size-3" />}>
                    Department
                  </TableHead>
                  <TableHead icon={<UserCheck className="size-3" />}>
                    Supervisor
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
                {pageUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="border-r-0 py-8 text-center text-sm text-stone-500"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link
                          to="/people/$id"
                          params={{ id: u.id }}
                          className="flex items-center gap-2 hover:opacity-90"
                        >
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-700"
                            aria-hidden
                          >
                            {getInitials(u.name)}
                          </span>
                          <span className="font-medium text-stone-900">
                            {u.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {u.email ?? '—'}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {roleById.get(u.role_id) ?? u.role_id}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {departmentById.get(u.department_id) ?? u.department_id}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {u.supervisor_id
                          ? userNameById.get(u.supervisor_id) ?? u.supervisor_id
                          : '—'}
                      </TableCell>
                      <TableCell className="border-r-0 text-right">
                        <Link
                          to="/people/$id"
                          params={{ id: u.id }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          View
                          <ArrowRight className="size-4" />
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
              total={totalFiltered}
              onPageChange={goToPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </TableContainer>
        </>
      )}
      <Outlet />
    </div>
  )
}
