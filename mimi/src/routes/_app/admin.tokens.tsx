import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  CalendarClock,
  Clock,
  Copy,
  FileText,
  MoreVertical,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  meQueryOptions,
  mutations,
  userTokensQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import { AdminDataTable } from '#/components/admin-data-table'
import { hasPermission, MANAGE_RBAC, MANAGE_USERS } from '#/lib/permissions'
import type {
  UserTokenCreateRequest,
  UserTokenResponse,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/tokens')({
  component: AdminTokensPage,
})

function AdminTokensPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<UserTokenCreateRequest>>({
    user_id: '',
    description: '',
    expires_at: null,
  })

  const { data: me } = useQuery(meQueryOptions())
  const canManageTokens =
    hasPermission(me?.permissions ?? [], MANAGE_RBAC) ||
    hasPermission(me?.permissions ?? [], MANAGE_USERS)

  const { data: tokens = [] } = useQuery(userTokensQueryOptions({ limit: 200 }))
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 200 }))
  const users = usersData?.items ?? []
  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = tokens.length
  const start = (page - 1) * pageSize
  const displayTokens = tokens.slice(start, start + pageSize)

  const createMutation = useMutation({
    mutationFn: (body: UserTokenCreateRequest) =>
      mutations.userTokens.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
      setIssuedToken(data.token)
    },
  })
  const revokeMutation = useMutation({
    mutationFn: (id: string) => mutations.userTokens.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
      setRevokeConfirmId(null)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.user_id) return
    const expiresAt =
      form.expires_at && form.expires_at.length >= 16
        ? new Date(form.expires_at).toISOString()
        : undefined
    createMutation.mutate({
      user_id: form.user_id,
      description: form.description ?? undefined,
      expires_at: expiresAt,
    })
  }

  function copyToken() {
    if (issuedToken) navigator.clipboard.writeText(issuedToken)
  }

  function openCreateModal() {
    setFormOpen(true)
    setIssuedToken(null)
    setForm({
      user_id: '',
      description: '',
      expires_at: null,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Tokens</h1>
        {canManageTokens && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            <Plus className="size-4" />
            Create token
          </button>
        )}
      </div>
      <AdminDataTable
        rows={displayTokens}
        columns={[
          {
            id: 'user',
            icon: <User className="size-3" />,
            header: 'User',
            cell: (t) => (
              <span className="font-medium text-stone-900">
                {userById[t.user_id] ?? t.user_id}
              </span>
            ),
          },
          {
            id: 'description',
            icon: <FileText className="size-3" />,
            header: 'Description',
            cell: (t) => (
              <span className="text-stone-600">{t.description ?? '—'}</span>
            ),
          },
          {
            id: 'expires_at',
            icon: <CalendarClock className="size-3" />,
            header: 'Expires at',
            cell: (t) => (
              <span className="text-stone-600">
                {t.revoked
                  ? 'Revoked'
                  : t.expires_at
                    ? format(parseISO(t.expires_at), 'MMM d, yyyy HH:mm')
                    : 'Never'}
              </span>
            ),
          },
          {
            id: 'created',
            icon: <Clock className="size-3" />,
            header: 'Created at',
            cell: (t) => (
              <span className="text-stone-600">
                {format(parseISO(t.created_at), 'MMM d, yyyy HH:mm')}
              </span>
            ),
          },
          ...(canManageTokens
            ? [
                {
                  id: 'actions' as const,
                  icon: <MoreVertical className="size-3" />,
                  header: 'Actions',
                  cell: (t: UserTokenResponse) => (
                    <div className="w-20">
                      {!t.revoked &&
                        (revokeConfirmId === t.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <span className="text-stone-500">Revoke?</span>
                            <button
                              type="button"
                              onClick={() => revokeMutation.mutate(t.id)}
                              disabled={revokeMutation.isPending}
                              className="font-medium text-red-600 hover:text-red-700"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setRevokeConfirmId(null)}
                              className="text-stone-500 hover:text-stone-700"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevokeConfirmId(t.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-3.5" />
                            Revoke
                          </button>
                        ))}
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border border-stone-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-stone-900">
              {issuedToken ? 'Token created' : 'Create token'}
            </h2>
            {issuedToken ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-amber-700">
                  This is the only time this token will be shown.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={issuedToken}
                    className="flex-1 border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={copyToken}
                    className="inline-flex items-center gap-1 border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
                  >
                    <Copy className="size-4" />
                    Copy
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    setIssuedToken(null)
                  }}
                  className="bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    User
                  </label>
                  <select
                    value={form.user_id ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, user_id: e.target.value }))
                    }
                    required
                    className="w-full border border-stone-200 px-3 py-2 text-sm"
                  >
                    <option value="">Select…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Description (optional)
                  </label>
                  <input
                    value={form.description ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Expires at (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expires_at ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        expires_at: e.target.value || null,
                      }))
                    }
                    className="w-full border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
