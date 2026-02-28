import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  SquarePen,
  Plus,
  Send,
  Trash2,
  User,
  UserCircle2,
} from 'lucide-react'
import {
  meQueryOptions,
  mutations,
  notificationLogsQueryOptions,
  notificationRulesQueryOptions,
  rolesQueryOptions,
} from '#/lib/queries'
import {
  hasPermission,
  MANAGE_NOTIFICATIONS,
  VIEW_AUDIT_LOGS,
} from '#/lib/permissions'
import { AdminDataTable } from '#/components/admin-data-table'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '#/components/ui/table'
import type {
  NotificationLogResponse,
  NotificationRuleCreate,
  NotificationRuleResponse,
  NotificationRuleUpdate,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/notifications')({
  component: AdminNotificationsPage,
})

const TEMPLATE_TRUNCATE = 60

function truncateBody(s: string | null | undefined): string {
  if (s == null || s === '') return '—'
  return s.length <= TEMPLATE_TRUNCATE
    ? s
    : `${s.slice(0, TEMPLATE_TRUNCATE)}…`
}

function formatSentAt(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRule, setEditRule] = useState<NotificationRuleResponse | null>(
    null,
  )
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [createForm, setCreateForm] =
    useState<Partial<NotificationRuleCreate>>({
      event_type: '',
      recipient_role_id: '',
      channel: '',
      template_body: '',
    })
  const [editForm, setEditForm] = useState<Partial<NotificationRuleUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManage = hasPermission(
    me?.permissions ?? [],
    MANAGE_NOTIFICATIONS,
  )

  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]))

  const { data: rules = [] } = useQuery(notificationRulesQueryOptions())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = rules.length
  const start = (page - 1) * pageSize
  const displayRules = rules.slice(start, start + pageSize)

  const canViewLogs = hasPermission(
    me?.permissions ?? [],
    VIEW_AUDIT_LOGS,
  )
  const { data: logsData } = useQuery({
    ...notificationLogsQueryOptions({ limit: 50 }),
    enabled: canViewLogs,
  })
  const logItems = logsData?.items ?? []

  const createMutation = useMutation({
    mutationFn: (body: NotificationRuleCreate) =>
      mutations.notificationRules.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] })
      setCreateOpen(false)
      setCreateForm({
        event_type: '',
        recipient_role_id: '',
        channel: '',
        template_body: '',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: { id: string; body: NotificationRuleUpdate }) =>
      mutations.notificationRules.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] })
      setEditRule(null)
      setEditForm({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mutations.notificationRules.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] })
      setDeleteConfirmId(null)
    },
  })

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !createForm.event_type ||
      !createForm.recipient_role_id ||
      !createForm.channel
    )
      return
    createMutation.mutate({
      event_type: createForm.event_type,
      recipient_role_id: createForm.recipient_role_id,
      channel: createForm.channel,
      template_body: createForm.template_body ?? undefined,
    })
  }

  function openEdit(r: NotificationRuleResponse) {
    setEditRule(r)
    setEditForm({
      event_type: r.event_type,
      recipient_role_id: r.recipient_role_id,
      channel: r.channel,
      template_body: r.template_body ?? undefined,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editRule) return
    updateMutation.mutate({
      id: editRule.id,
      body: {
        event_type: editForm.event_type,
        recipient_role_id: editForm.recipient_role_id,
        channel: editForm.channel,
        template_body: editForm.template_body,
      },
    })
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-stone-900">
            Notification rules
          </h1>
          {canManage && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
            >
              <Plus className="size-4" />
              Create rule
            </button>
          )}
        </div>
        <AdminDataTable
          rows={displayRules}
          columns={[
            {
              id: 'event',
              icon: <Bell className="size-3" />,
              header: 'Event type',
              cell: (r) => (
                <span className="font-medium text-stone-900">
                  {r.event_type}
                </span>
              ),
            },
            {
              id: 'role',
              icon: <UserCircle2 className="size-3" />,
              header: 'Recipient role',
              cell: (r) => (
                <span className="text-stone-600">
                  {roleById[r.recipient_role_id]?.name ?? r.recipient_role_id}
                </span>
              ),
            },
            {
              id: 'channel',
              icon: <Send className="size-3" />,
              header: 'Channel',
              cell: (r) => (
                <span className="text-stone-600">{r.channel}</span>
              ),
            },
            {
              id: 'template',
              icon: <FileText className="size-3" />,
              header: 'Template body',
              cell: (r) => (
                <span
                  className="max-w-xs truncate text-stone-500"
                  title={r.template_body ?? ''}
                >
                  {truncateBody(r.template_body)}
                </span>
              ),
            },
            ...(canManage
              ? [
                  {
                    id: 'actions' as const,
                    icon: <SquarePen className="size-3" />,
                    header: 'Edit / Delete',
                    cell: (r: NotificationRuleResponse) => (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-amber-600"
                          aria-label={`Edit rule ${r.event_type}`}
                        >
                          <SquarePen className="size-4" />
                        </button>
                        {deleteConfirmId === r.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                deleteMutation.mutate(r.id)
                              }
                              disabled={deleteMutation.isPending}
                              className="text-red-600 underline"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-stone-500"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete rule ${r.event_type}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
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
      </section>

      {canViewLogs && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-stone-900">
            Notification logs
          </h2>
          <TableContainer>
            <Table className="text-sm">
              <TableHeader>
                <TableHeaderRow>
                  <TableHead icon={<Bell className="size-3" />}>
                    Event type
                  </TableHead>
                  <TableHead icon={<User className="size-3" />}>
                    Recipient
                  </TableHead>
                  <TableHead icon={<Send className="size-3" />}>
                    Channel
                  </TableHead>
                  <TableHead icon={<CheckCircle className="size-3" />}>
                    Status
                  </TableHead>
                  <TableHead icon={<Clock className="size-3" />}>
                    Sent at
                  </TableHead>
                  <TableHead
                    icon={<AlertCircle className="size-3" />}
                    className="border-r-0"
                  >
                    Error message
                  </TableHead>
                </TableHeaderRow>
              </TableHeader>
              <TableBody>
                {logItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-stone-400"
                    >
                      No log entries.
                    </TableCell>
                  </TableRow>
                ) : (
                  logItems.map((log: NotificationLogResponse) => (
                    <TableRow
                      key={log.id}
                      className={
                        log.status === 'failed' || log.status === 'error'
                          ? 'bg-red-50'
                          : undefined
                      }
                    >
                      <TableCell className="font-medium text-stone-900">
                        {log.event_type}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {log.recipient_name ?? log.recipient_id ?? '—'}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {log.channel}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            log.status === 'sent'
                              ? 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                              : 'rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800'
                          }
                        >
                          {log.status === 'sent' ? 'Sent' : 'Failed'}
                        </span>
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {formatSentAt(log.sent_at)}
                      </TableCell>
                      <TableCell className="border-r-0 text-stone-600">
                        {log.error_message ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </section>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Create rule
            </h2>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Event type
                </label>
                <input
                  value={createForm.event_type ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      event_type: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Recipient role
                </label>
                <select
                  value={createForm.recipient_role_id ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      recipient_role_id: e.target.value,
                    }))
                  }
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Channel
                </label>
                <input
                  value={createForm.channel ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, channel: e.target.value }))
                  }
                  placeholder="e.g. email, slack"
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Template body
                </label>
                <textarea
                  value={createForm.template_body ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      template_body: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
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

      {editRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Edit rule
            </h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Event type
                </label>
                <input
                  value={editForm.event_type ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      event_type: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Recipient role
                </label>
                <select
                  value={editForm.recipient_role_id ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      recipient_role_id: e.target.value,
                    }))
                  }
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
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Channel
                </label>
                <input
                  value={editForm.channel ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, channel: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Template body
                </label>
                <textarea
                  value={editForm.template_body ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      template_body: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-red-600">
                  {(updateMutation.error as { body?: { detail?: string } }).body
                    ?.detail ?? 'Failed to update'}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditRule(null)
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
