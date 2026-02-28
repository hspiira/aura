import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Copy, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  userTokensQueryOptions,
  usersQueryOptions,
  mutations,
} from '#/lib/queries'
import type { UserTokenCreateRequest } from '#/lib/types'

export const Route = createFileRoute('/_app/admin/tokens')({
  component: AdminTokensPage,
})

function AdminTokensPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<UserTokenCreateRequest>>({
    user_id: '',
    description: '',
    expires_at: null,
  })

  const { data: tokens = [] } = useQuery(userTokensQueryOptions({ limit: 200 }))
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 200 }))
  const users = usersData?.items ?? []
  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const createMutation = useMutation({
    mutationFn: (body: UserTokenCreateRequest) => mutations.userTokens.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
      setIssuedToken(data.token)
    },
  })
  const revokeMutation = useMutation({
    mutationFn: (id: string) => mutations.userTokens.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-tokens'] }),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.user_id) return
    createMutation.mutate({
      user_id: form.user_id,
      description: form.description ?? undefined,
      expires_at: form.expires_at ?? undefined,
    })
  }

  function copyToken() {
    if (issuedToken) navigator.clipboard.writeText(issuedToken)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Tokens</h1>
        <button
          type="button"
          onClick={() => {
            setFormOpen(true)
            setIssuedToken(null)
            setForm({ user_id: '', description: '', expires_at: null })
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
        >
          <Plus className="size-4" />
          Issue token
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left font-semibold text-stone-700">User</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Revoked</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Created</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {tokens.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">
                  {userById[t.user_id] ?? t.user_id}
                </td>
                <td className="px-4 py-3 text-stone-600">{t.description ?? '—'}</td>
                <td className="px-4 py-3">
                  {t.revoked ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Revoked</span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {format(parseISO(t.created_at), 'MMM d HH:mm')}
                </td>
                <td className="px-4 py-3">
                  {!t.revoked && (
                    <button
                      type="button"
                      onClick={() => revokeMutation.mutate(t.id)}
                      disabled={revokeMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              {issuedToken ? 'Token created' : 'Issue token'}
            </h2>
            {issuedToken ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-amber-700">
                  Copy the token now. It will not be shown again.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={issuedToken}
                    className="flex-1 rounded border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={copyToken}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
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
                  className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">User</label>
                  <select
                    value={form.user_id ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
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
                  <label className="mb-1 block text-sm font-medium text-stone-700">Description (optional)</label>
                  <input
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                    Issue
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
