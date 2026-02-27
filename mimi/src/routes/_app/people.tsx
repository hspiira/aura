import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  usersQueryOptions,
  rolesQueryOptions,
  departmentsQueryOptions,
} from '#/lib/queries'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/people')({
  component: PeoplePage,
})

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function PeoplePage() {
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 200 }))
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())

  const users = usersData?.items ?? []
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r.name]))
  const departmentById = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-stone-900">People</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Users, roles, and departments.
        </p>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm',
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-stone-200 bg-stone-50 hover:bg-stone-50">
              <TableHead className="text-xs font-semibold text-stone-500">
                User
              </TableHead>
              <TableHead className="text-xs font-semibold text-stone-500">
                Role
              </TableHead>
              <TableHead className="text-xs font-semibold text-stone-500">
                Department
              </TableHead>
              <TableHead className="text-xs font-semibold text-stone-500">
                Supervisor
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-stone-100 transition-colors hover:bg-stone-50/50"
              >
                <TableCell>
                  <Link
                    to="/people/$id"
                    params={{ id: user.id }}
                    className="flex items-center gap-2.5 hover:opacity-90"
                  >
                    <Avatar size="sm" className="shrink-0">
                      <AvatarImage src={undefined} alt={user.name} />
                      <AvatarFallback className="bg-stone-200 text-stone-700 text-xs">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-stone-900">
                      {user.name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-stone-600">
                  {roleById[user.role_id] ?? user.role_id}
                </TableCell>
                <TableCell className="text-sm text-stone-600">
                  {departmentById[user.department_id] ?? user.department_id}
                </TableCell>
                <TableCell className="text-sm text-stone-600">
                  {user.supervisor_id
                    ? userById[user.supervisor_id] ?? user.supervisor_id
                    : '—'}
                </TableCell>
                <TableCell>
                  <Link
                    to="/people/$id"
                    params={{ id: user.id }}
                    className="text-amber-600 hover:text-amber-700 text-sm"
                  >
                    View →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
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
      </div>
    </div>
  )
}
