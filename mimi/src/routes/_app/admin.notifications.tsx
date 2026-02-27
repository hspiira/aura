import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Plus,
  Bell,
  UserCircle2,
  Send,
  FileText,
} from 'lucide-react'
import { notificationRulesQueryOptions, rolesQueryOptions, mutations } from '#/lib/queries'
import type { NotificationRuleCreate } from '#/lib/types'
import { TablePagination } from '#/components/ui/table-pagination'

export const Route = createFileRoute('/_app/admin/notifications')({
  component: AdminNotificationsPage,
})

function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<NotificationRuleCreate>>({
    event_type: '',
    recipient_role_id: '',
    channel: '',
    template_body: '',
  })
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: rules = [] } = useQuery(notificationRulesQueryOptions())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = rules.length
  const start = (page - 1) * pageSize
  const displayRules = rules.slice(start, start + pageSize)
  const createMutation = useMutation({
    mutationFn: (body: NotificationRuleCreate) => mutations.notificationRules.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] })
      setFormOpen(false)
      setForm({ event_type: '', recipient_role_id: '', channel: '', template_body: '' })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.event_type || !form.recipient_role_id || !form.channel) return
    createMutation.mutate({
      event_type: form.event_type,
      recipient_role_id: form.recipient_role_id,
      channel: form.channel,
      template_body: form.template_body ?? undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Notification rules</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
        >
          <Plus className="size-4" />
          Add rule
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Bell className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Event type
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <UserCircle2 className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Recipient role
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Send className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Channel
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Template
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {displayRules.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">{r.event_type}</td>
                <td className="px-4 py-3 text-stone-600">{r.recipient_role_id}</td>
                <td className="px-4 py-3 text-stone-600">{r.channel}</td>
                <td className="max-w-xs truncate px-4 py-3 text-stone-500" title={r.template_body ?? ''}>
                  {r.template_body ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      </div>
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">Add notification rule</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Event type</label>
                <input
                  value={form.event_type ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Recipient role</label>
                <select
                  value={form.recipient_role_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, recipient_role_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Channel</label>
                <input
                  value={form.channel ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Template body (optional)</label>
                <textarea
                  value={form.template_body ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, template_body: e.target.value }))}
                  rows={2}
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
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
