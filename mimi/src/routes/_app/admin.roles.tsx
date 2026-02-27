import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { rolesQueryOptions, permissionsQueryOptions, rolePermissionsQueryOptions, mutations } from '#/lib/queries'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/admin/roles')({
  component: AdminRolesPage,
})

function AdminRolesPage() {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')

  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: permissions = [] } = useQuery(permissionsQueryOptions())
  const { data: rolePerms = [] } = useQuery(
    rolePermissionsQueryOptions({ role_id: selectedRoleId }),
    { enabled: !!selectedRoleId },
  )
  const assignedPermIds = new Set(rolePerms.map((rp) => rp.permission_id))

  const assignMutation = useMutation({
    mutationFn: (payload: { role_id: string; permission_id: string }) =>
      mutations.rolePermissions.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
    },
  })
  const removeMutation = useMutation({
    mutationFn: (id: string) => mutations.rolePermissions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] })
    },
  })

  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]))
  const permById = Object.fromEntries(permissions.map((p) => [p.id, p]))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">Roles & permissions</h1>
      <div className="flex gap-4">
        <div className="w-56 shrink-0 rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
          <p className="mb-2 px-2 text-xs font-semibold text-stone-500">Role</p>
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRoleId(r.id)}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                selectedRoleId === r.id ? 'bg-amber-100 text-amber-900' : 'text-stone-700 hover:bg-stone-50',
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          {!selectedRoleId ? (
            <p className="text-sm text-stone-500">Select a role.</p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-stone-700">
                Permissions for {roleById[selectedRoleId]?.name ?? selectedRoleId}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((perm) => {
                  const assigned = assignedPermIds.has(perm.id)
                  const rp = rolePerms.find((x) => x.permission_id === perm.id)
                  return (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2"
                    >
                      <span className="text-sm text-stone-800">{perm.code ?? perm.id}</span>
                      {assigned && rp ? (
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(rp.id)}
                          disabled={removeMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            assignMutation.mutate({
                              role_id: selectedRoleId,
                              permission_id: perm.id,
                            })
                          }
                          disabled={assignMutation.isPending}
                          className="text-xs text-amber-600 hover:text-amber-700"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
