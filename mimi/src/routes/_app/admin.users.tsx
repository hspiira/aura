import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  MainUserTable,
  type MainUserTablePeopleRow,
} from '#/components/main-user-table'
import {
  departmentsQueryOptions,
  meQueryOptions,
  mutations,
  rolesQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import { hasPermission, MANAGE_USERS } from '#/lib/permissions'
import type { UserCreate, UserResponse, UserUpdate } from '#/lib/types'

export const Route = createFileRoute('/_app/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [form, setForm] = useState<Partial<UserCreate>>({
    role_id: '',
    department_id: '',
    supervisor_id: null,
    name: '',
    email: '',
  })
  const [editForm, setEditForm] = useState<Partial<UserUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManageUsers = hasPermission(me?.permissions ?? [], MANAGE_USERS)

  const { data: usersData } = useQuery(usersQueryOptions({ limit: 200 }))
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())
  const users = usersData?.items ?? []

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = users.length
  const start = (page - 1) * pageSize

  const createMutation = useMutation({
    mutationFn: (body: UserCreate) => mutations.users.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFormOpen(false)
      setForm({
        role_id: '',
        department_id: '',
        supervisor_id: null,
        name: '',
        email: '',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UserUpdate }) =>
      mutations.users.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditOpen(false)
      setEditingUser(null)
      setEditForm({})
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

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.role_id || !form.department_id || !form.name) return
    createMutation.mutate({
      role_id: form.role_id,
      department_id: form.department_id,
      supervisor_id: form.supervisor_id ?? undefined,
      name: form.name,
      email: form.email ?? undefined,
    })
  }

  function openEdit(row: MainUserTablePeopleRow) {
    const user = users.find((u) => u.id === row.id)
    if (!user) return
    setEditingUser(user)
    setEditForm({
      role_id: user.role_id,
      department_id: user.department_id,
      supervisor_id: user.supervisor_id ?? null,
      name: user.name,
      email: user.email ?? null,
    })
    setEditOpen(true)
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    updateMutation.mutate({
      id: editingUser.id,
      body: {
        role_id: editForm.role_id,
        department_id: editForm.department_id,
        supervisor_id: editForm.supervisor_id,
        name: editForm.name,
        email: editForm.email,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Users</h1>
        {canManageUsers && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            <Plus className="size-4" />
            Create user
          </button>
        )}
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
        showUserId={false}
        onEdit={canManageUsers ? openEdit : undefined}
        className="rounded-xl shadow-sm"
      />
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">Create user</h2>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
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
                <label className="mb-1 block text-sm font-medium text-stone-700">Email (optional)</label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
                <label className="mb-1 block text-sm font-medium text-stone-700">Supervisor (optional)</label>
                <select
                  value={form.supervisor_id ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      supervisor_id: e.target.value || null,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
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
      {editOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">Edit user</h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Email (optional)</label>
                <input
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value || null }))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Role</label>
                <select
                  value={editForm.role_id ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, role_id: e.target.value }))}
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
                  value={editForm.department_id ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, department_id: e.target.value }))}
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
                <label className="mb-1 block text-sm font-medium text-stone-700">Supervisor (optional)</label>
                <select
                  value={editForm.supervisor_id ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      supervisor_id: e.target.value || null,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {users.filter((u) => u.id !== editingUser.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-red-600">
                  {(updateMutation.error as { body?: { detail?: string } })?.body?.detail ??
                    'Failed to update'}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false)
                    setEditingUser(null)
                    setEditForm({})
                  }}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
