import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { MainUserTable, type MainUserTablePeopleRow } from '#/components/main-user-table'
import {
  usersQueryOptions,
  rolesQueryOptions,
  departmentsQueryOptions,
} from '#/lib/queries'

const DEFAULT_PAGE_SIZE = 10

export const Route = createFileRoute('/_app/people')({
  component: PeoplePage,
})

function PeoplePage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isListPage = pathname === '/people'

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const offset = (page - 1) * pageSize
  const { data: usersData } = useQuery(
    usersQueryOptions({ limit: pageSize, offset }),
  )
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())

  const users = usersData?.items ?? []
  const totalCount = usersData?.total ?? 0
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r.name]))
  const departmentById = Object.fromEntries(
    departments.map((d) => [d.id, d.name]),
  )
  const supervisorById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const tableData: MainUserTablePeopleRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ?? null,
    role_id: u.role_id,
    department_id: u.department_id,
    supervisor_id: u.supervisor_id ?? null,
  }))

  return (
    <div className="space-y-4">
      {isListPage && (
        <>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">People</h1>
            <p className="mt-0.5 text-sm text-stone-500">
              Users, roles, and departments.
            </p>
          </div>

          <MainUserTable
            variant="people"
            data={tableData}
            roleById={roleById}
            departmentById={departmentById}
            supervisorById={supervisorById}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </>
      )}
      <Outlet />
    </div>
  )
}
