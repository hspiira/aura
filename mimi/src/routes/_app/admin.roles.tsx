import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  rolesQueryOptions,
  departmentsQueryOptions,
  permissionsQueryOptions,
  rolePermissionsQueryOptions,
  roleDimensionWeightsQueryOptions,
  performanceDimensionsQueryOptions,
  mutations,
  meQueryOptions,
} from '#/lib/queries'
import { hasPermission, MANAGE_RBAC } from '#/lib/permissions'
import type {
  RoleCreate,
  RoleUpdate,
  RoleResponse,
  RoleDimensionWeightCreate,
  RoleDimensionWeightUpdate,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/roles')({
  component: AdminRolesPage,
})

function AdminRolesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleResponse | null>(null)
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<Partial<RoleCreate>>({
    department_id: '',
    name: '',
    level: '',
    is_managerial: false,
  })
  const [editForm, setEditForm] = useState<Partial<RoleUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManageRbac = hasPermission(me?.permissions ?? [], MANAGE_RBAC)

  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())

  const createMutation = useMutation({
    mutationFn: (body: RoleCreate) => mutations.roles.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setCreateOpen(false)
      setCreateForm({ department_id: '', name: '', level: '', is_managerial: false })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RoleUpdate }) =>
      mutations.roles.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setEditRole(null)
      setEditForm({})
    },
  })

  const departmentById = Object.fromEntries(
    departments.map((d) => [d.id, d.name]),
  )

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.department_id || !createForm.name) return
    createMutation.mutate({
      department_id: createForm.department_id,
      name: createForm.name,
      level: createForm.level || undefined,
      is_managerial: createForm.is_managerial ?? false,
    })
  }

  function openEdit(role: RoleResponse) {
    setEditRole(role)
    setEditForm({
      department_id: role.department_id,
      name: role.name,
      level: role.level ?? undefined,
      is_managerial: role.is_managerial,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editRole) return
    updateMutation.mutate({
      id: editRole.id,
      body: {
        department_id: editForm.department_id,
        name: editForm.name,
        level: editForm.level ?? undefined,
        is_managerial: editForm.is_managerial,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Roles</h1>
        {canManageRbac && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            <Plus className="size-4" />
            Create role
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="w-8 px-2 py-2" aria-label="Expand" />
              <th className="px-3 py-2 text-left font-semibold text-stone-700">
                Role name
              </th>
              <th className="px-3 py-2 text-left font-semibold text-stone-700">
                Department
              </th>
              <th className="px-3 py-2 text-left font-semibold text-stone-700">
                Level
              </th>
              <th className="px-3 py-2 text-left font-semibold text-stone-700">
                Is managerial
              </th>
              {canManageRbac && (
                <th className="w-12 px-2 py-2" aria-label="Edit" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {roles.map((role) => (
              <Fragment key={role.id}>
                <tr className="hover:bg-stone-50/50">
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRoleId((id) =>
                          id === role.id ? null : role.id,
                        )
                      }
                      className="text-stone-500 hover:text-stone-700"
                      aria-label={expandedRoleId === role.id ? 'Collapse' : 'Expand'}
                    >
                      {expandedRoleId === role.id ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium text-stone-900">
                    {role.name}
                  </td>
                  <td className="px-3 py-2 text-stone-600">
                    {departmentById[role.department_id] ?? role.department_id}
                  </td>
                  <td className="px-3 py-2 text-stone-600">
                    {role.level ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    {role.is_managerial ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Yes
                      </span>
                    ) : (
                      <span className="text-stone-400">No</span>
                    )}
                  </td>
                  {canManageRbac && (
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
                {expandedRoleId === role.id && (
                  <tr>
                    <td
                      colSpan={canManageRbac ? 6 : 5}
                      className="bg-stone-50/50 p-0"
                    >
                      <RoleDetails
                        roleId={role.id}
                        canManageRbac={canManageRbac}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">Create role</h2>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Department
                </label>
                <select
                  value={createForm.department_id ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, department_id: e.target.value }))
                  }
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Name
                </label>
                <input
                  value={createForm.name ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Level (optional)
                </label>
                <input
                  value={createForm.level ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, level: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-managerial"
                  checked={createForm.is_managerial ?? false}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      is_managerial: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="create-managerial"
                  className="text-sm font-medium text-stone-700"
                >
                  Is managerial
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
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

      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">Edit role</h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Department
                </label>
                <select
                  value={editForm.department_id ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, department_id: e.target.value }))
                  }
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Name
                </label>
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Level (optional)
                </label>
                <input
                  value={editForm.level ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, level: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-managerial"
                  checked={editForm.is_managerial ?? false}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      is_managerial: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="edit-managerial"
                  className="text-sm font-medium text-stone-700"
                >
                  Is managerial
                </label>
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-red-600">
                  {(updateMutation.error as { body?: { detail?: string } })
                    ?.body?.detail ?? 'Failed to update'}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditRole(null)
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

function RoleDetails({
  roleId,
  canManageRbac,
}: {
  roleId: string
  canManageRbac: boolean
}) {
  const queryClient = useQueryClient()
  const [addWeightDim, setAddWeightDim] = useState('')
  const [addWeightPct, setAddWeightPct] = useState('')
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null)
  const [editWeightPct, setEditWeightPct] = useState('')
  const [addPermId, setAddPermId] = useState('')
  const [removePermConfirm, setRemovePermConfirm] = useState<string | null>(null)

  const { data: weights = [] } = useQuery({
    ...roleDimensionWeightsQueryOptions({ role_id: roleId }),
    enabled: !!roleId,
  })
  const { data: rolePerms = [] } = useQuery({
    ...rolePermissionsQueryOptions({ role_id: roleId }),
    enabled: !!roleId,
  })
  const { data: dimensions = [] } = useQuery(
    performanceDimensionsQueryOptions(),
  )
  const { data: permissions = [] } = useQuery(permissionsQueryOptions())

  const assignPermMutation = useMutation({
    mutationFn: (payload: { role_id: string; permission_id: string }) =>
      mutations.rolePermissions.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
    },
  })
  const removePermMutation = useMutation({
    mutationFn: (id: string) => mutations.rolePermissions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
      setRemovePermConfirm(null)
    },
  })
  const addWeightMutation = useMutation({
    mutationFn: (body: RoleDimensionWeightCreate) =>
      mutations.roleDimensionWeights.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-dimension-weights'] })
      setAddWeightDim('')
      setAddWeightPct('')
    },
  })
  const updateWeightMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: RoleDimensionWeightUpdate
    }) => mutations.roleDimensionWeights.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-dimension-weights'] })
      setEditingWeightId(null)
      setEditWeightPct('')
    },
  })
  const deleteWeightMutation = useMutation({
    mutationFn: (id: string) => mutations.roleDimensionWeights.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-dimension-weights'] })
    },
  })

  const dimensionById = Object.fromEntries(
    dimensions.map((d) => [d.id, d.name]),
  )
  const permById = Object.fromEntries(permissions.map((p) => [p.id, p]))
  const assignedDimensionIds = new Set(weights.map((w) => w.dimension_id))
  const unassignedDimensions = dimensions.filter(
    (d) => !assignedDimensionIds.has(d.id),
  )
  const unassignedPermIds = permissions.filter(
    (p) => !rolePerms.some((rp) => rp.permission_id === p.id),
  )

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Dimension weights
        </h3>
        <div className="space-y-2">
          {weights.length === 0 ? (
            <p className="text-sm text-stone-500">No dimension weights.</p>
          ) : (
            <ul className="space-y-1">
              {weights.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-white px-3 py-2"
                >
                  <span className="text-sm text-stone-800">
                    {dimensionById[w.dimension_id] ?? w.dimension_id}{' '}
                    <span className="font-medium">{w.weight_pct}%</span>
                  </span>
                  {canManageRbac && (
                    <div className="flex items-center gap-1">
                      {editingWeightId === w.id ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editWeightPct}
                            onChange={(e) => setEditWeightPct(e.target.value)}
                            className="w-16 rounded border border-stone-200 px-2 py-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const pct = editWeightPct.trim()
                              if (pct) {
                                updateWeightMutation.mutate({
                                  id: w.id,
                                  body: { weight_pct: pct },
                                })
                              }
                            }}
                            disabled={updateWeightMutation.isPending}
                            className="text-xs text-amber-600 hover:text-amber-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWeightId(null)
                              setEditWeightPct('')
                            }}
                            className="text-xs text-stone-500 hover:text-stone-700"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWeightId(w.id)
                              setEditWeightPct(w.weight_pct)
                            }}
                            className="text-xs text-amber-600 hover:text-amber-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              deleteWeightMutation.mutate(w.id)
                            }
                            disabled={deleteWeightMutation.isPending}
                            className="text-xs text-red-600 hover:text-red-700"
                            aria-label="Delete weight"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canManageRbac && unassignedDimensions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-2">
              <select
                value={addWeightDim}
                onChange={(e) => setAddWeightDim(e.target.value)}
                className="rounded border border-stone-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Add weight…</option>
                {unassignedDimensions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="%"
                value={addWeightPct}
                onChange={(e) => setAddWeightPct(e.target.value)}
                className="w-16 rounded border border-stone-200 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!addWeightDim || !addWeightPct.trim()) return
                  addWeightMutation.mutate({
                    role_id: roleId,
                    dimension_id: addWeightDim,
                    weight_pct: addWeightPct.trim(),
                  })
                }}
                disabled={
                  addWeightMutation.isPending || !addWeightDim || !addWeightPct.trim()
                }
                className="rounded bg-stone-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                Add weight
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Permissions
        </h3>
        <div className="space-y-2">
          {rolePerms.length === 0 ? (
            <p className="text-sm text-stone-500">No permissions assigned.</p>
          ) : (
            <ul className="space-y-1">
              {rolePerms.map((rp) => (
                <li
                  key={rp.id}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-white px-3 py-2"
                >
                  <span className="text-sm text-stone-800">
                    {permById[rp.permission_id]?.code ?? permById[rp.permission_id]?.name ?? rp.permission_id}
                  </span>
                  {canManageRbac && (
                    removePermConfirm === rp.id ? (
                      <span className="flex items-center gap-1 text-xs">
                        <span className="text-stone-500">Remove?</span>
                        <button
                          type="button"
                          onClick={() => removePermMutation.mutate(rp.id)}
                          disabled={removePermMutation.isPending}
                          className="font-medium text-red-600 hover:text-red-700"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemovePermConfirm(null)}
                          className="text-stone-500 hover:text-stone-700"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemovePermConfirm(rp.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
          {canManageRbac && unassignedPermIds.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-2">
              <select
                value={addPermId}
                onChange={(e) => setAddPermId(e.target.value)}
                className="rounded border border-stone-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Add permission…</option>
                {unassignedPermIds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ?? p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!addPermId) return
                  assignPermMutation.mutate({
                    role_id: roleId,
                    permission_id: addPermId,
                  })
                  setAddPermId('')
                }}
                disabled={assignPermMutation.isPending || !addPermId}
                className="rounded bg-stone-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                Add permission
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
