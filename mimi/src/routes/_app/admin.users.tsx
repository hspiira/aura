import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TablePagination } from '#/components/ui/table-pagination'
import {
  MainUserTable,
  type MainUserTablePeopleRow,
} from '#/components/main-user-table'
import {
  usersQueryOptions,
  rolesQueryOptions,
  departmentsQueryOptions,
  mutations,
} from '#/lib/queries'
import type { UserCreate } from '#/lib/types'

export const Route = createFileRoute('/_app/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<UserCreate>>({
    role_id: '',
    department_id: '',
    name: '',
    email: '',
  })

  const { data: usersData } = useQuery(usersQueryOptions({ limit: 200 }))
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())
  const users = usersData?.items ?? []

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = users.length
  const start = (page - 1) * pageSize
  const displayUsers = users.slice(start, start + pageSize)

  const createMutation = useMutation({
    mutationFn: (body: UserCreate) => mutations.users.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFormOpen(false)
      setForm({ role_id: '', department_id: '', name: '', email: '' })
    },
  })

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.role_id || !form.department_id || !form.name) return
    createMutation.mutate({
      role_id: form.role_id,
      department_id: form.department_id,
      name: form.name,
      email: form.email ?? undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Users</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
        >
          <Plus className="size-4" />
          Create user
        </button>
      </div>
      <MainUserTable
        variant="people"
        data={tableData.slice(start, start + pageSize)}
        roleById={roleById}
        departmentById={departmentById}
        supervisorById={supervisorById}
        page={page}
        pageSize={pageSize}
        totalCount={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        className="rounded-xl shadow-sm"
      />
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">Create user</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
                <input
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Role</label>
                <select
                  value={form.role_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Department</label>
                <select
                  value={form.department_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Email (optional)</label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
