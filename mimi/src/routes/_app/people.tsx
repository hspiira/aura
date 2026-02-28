import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  departmentsQueryOptions,
  rolesQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import { TablePagination } from '#/components/ui/table-pagination'

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

          <div className="overflow-hidden border border-stone-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80">
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-700">
                      Supervisor
                    </th>
                    <th className="w-20 px-4 py-3 text-right font-semibold text-stone-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pageUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-stone-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    pageUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {u.email ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {roleById.get(u.role_id) ?? u.role_id}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {departmentById.get(u.department_id) ?? u.department_id}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {u.supervisor_id
                            ? userNameById.get(u.supervisor_id) ?? u.supervisor_id
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/people/$id"
                            params={{ id: u.id }}
                            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                          >
                            View
                            <ArrowRight className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={totalFiltered}
              onPageChange={goToPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        </>
      )}
      <Outlet />
    </div>
  )
}
