import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Calendar, Hash, Lock, Pencil, Plus } from 'lucide-react'
import { AdminDataTable } from '#/components/admin-data-table'
import {
  meQueryOptions,
  mutations,
  performanceCyclesQueryOptions,
} from '#/lib/queries'
import { hasPermission, MANAGE_CYCLES } from '#/lib/permissions'
import type {
  PerformanceCycleCreate,
  PerformanceCycleResponse,
  PerformanceCycleUpdate,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/cycles')({
  component: AdminCyclesPage,
})

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'draft') return 'bg-stone-100 text-stone-600'
  if (['active', 'approved', 'completed'].some((x) => s.includes(x)))
    return 'bg-emerald-100 text-emerald-700'
  if (['closed', 'cancelled'].some((x) => s.includes(x)))
    return 'bg-stone-200 text-stone-500'
  return 'bg-amber-100 text-amber-700'
}

function AdminCyclesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCycle, setEditCycle] = useState<PerformanceCycleResponse | null>(
    null,
  )
  const [createForm, setCreateForm] = useState<Partial<PerformanceCycleCreate>>(
    {
      name: '',
      start_date: '',
      end_date: '',
      status: 'draft',
      review_frequency: '',
      objectives_lock_date: null,
    },
  )
  const [editForm, setEditForm] = useState<Partial<PerformanceCycleUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManageCycles = hasPermission(me?.permissions ?? [], MANAGE_CYCLES)

  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = cycles.length
  const start = (page - 1) * pageSize
  const displayCycles = cycles.slice(start, start + pageSize)

  const createMutation = useMutation({
    mutationFn: (body: PerformanceCycleCreate) =>
      mutations.performanceCycles.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      setCreateOpen(false)
      setCreateForm({
        name: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        review_frequency: '',
        objectives_lock_date: null,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: PerformanceCycleUpdate
    }) => mutations.performanceCycles.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      setEditCycle(null)
      setEditForm({})
    },
  })

  const lockMutation = useMutation({
    mutationFn: (id: string) => mutations.performanceCycles.lockObjectives(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['performance-cycles', id] })
    },
  })

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.name || !createForm.start_date || !createForm.end_date)
      return
    createMutation.mutate({
      name: createForm.name,
      start_date: createForm.start_date,
      end_date: createForm.end_date,
      status: createForm.status ?? 'draft',
      review_frequency: createForm.review_frequency || undefined,
      objectives_lock_date: createForm.objectives_lock_date || undefined,
    })
  }

  function openEdit(c: PerformanceCycleResponse) {
    setEditCycle(c)
    setEditForm({
      name: c.name,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      review_frequency: c.review_frequency ?? undefined,
      objectives_lock_date: c.objectives_lock_date ?? undefined,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editCycle) return
    updateMutation.mutate({
      id: editCycle.id,
      body: {
        name: editForm.name,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        status: editForm.status,
        review_frequency: editForm.review_frequency ?? undefined,
        objectives_lock_date: editForm.objectives_lock_date ?? undefined,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Cycles</h1>
        {canManageCycles && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            <Plus className="size-4" />
            Create cycle
          </button>
        )}
      </div>
      <AdminDataTable
        rows={displayCycles}
        columns={[
          {
            id: 'name',
            header: (
              <div className="flex items-center gap-1.5">
                <Hash className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Name</span>
              </div>
            ),
            cell: (c) => (
              <span className="font-medium text-stone-900">{c.name}</span>
            ),
          },
          {
            id: 'dates',
            header: (
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Dates</span>
              </div>
            ),
            cell: (c) => (
              <span className="text-stone-600">
                {format(parseISO(c.start_date), 'MMM d')} –{' '}
                {format(parseISO(c.end_date), 'MMM d')}
              </span>
            ),
          },
          {
            id: 'status',
            header: (
              <span className="text-xs font-semibold text-stone-700">Status</span>
            ),
            cell: (c) => (
              <span
                className={`rounded px-2 py-0.5 text-xs capitalize ${statusBadgeClass(c.status)}`}
              >
                {c.status}
              </span>
            ),
          },
          {
            id: 'review_frequency',
            header: (
              <span className="text-xs font-semibold text-stone-700">
                Review frequency
              </span>
            ),
            cell: (c) => (
              <span className="text-stone-600">
                {c.review_frequency ?? '—'}
              </span>
            ),
          },
          {
            id: 'lock_date',
            header: (
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Lock date
                </span>
              </div>
            ),
            cell: (c) => (
              <span className="text-stone-600">
                {c.objectives_lock_date
                  ? format(parseISO(c.objectives_lock_date), 'MMM d')
                  : '—'}
              </span>
            ),
          },
          ...(canManageCycles
            ? [
                {
                  id: 'actions' as const,
                  header: <span className="sr-only">Edit</span>,
                  cell: (c: PerformanceCycleResponse) => (
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
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
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Create cycle
            </h2>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
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
                  Start date
                </label>
                <input
                  type="date"
                  value={createForm.start_date ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  End date
                </label>
                <input
                  type="date"
                  value={createForm.end_date ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Status
                </label>
                <select
                  value={createForm.status ?? 'draft'}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="completed">completed</option>
                  <option value="closed">closed</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Review frequency (optional)
                </label>
                <input
                  value={createForm.review_frequency ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      review_frequency: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Objectives lock date (optional)
                </label>
                <input
                  type="date"
                  value={createForm.objectives_lock_date ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      objectives_lock_date: e.target.value || null,
                    }))
                  }
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
      {editCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Edit cycle
            </h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
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
                  Start date
                </label>
                <input
                  type="date"
                  value={editForm.start_date ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  End date
                </label>
                <input
                  type="date"
                  value={editForm.end_date ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Status
                </label>
                <select
                  value={editForm.status ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="completed">completed</option>
                  <option value="closed">closed</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Review frequency (optional)
                </label>
                <input
                  value={editForm.review_frequency ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      review_frequency: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Objectives lock date (optional)
                </label>
                <input
                  type="date"
                  value={editForm.objectives_lock_date ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      objectives_lock_date: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-red-600">
                  {(updateMutation.error as { body?: { detail?: string } })
                    ?.body?.detail ?? 'Failed to update'}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditCycle(null)
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
                {!editCycle.objectives_locked_at && (
                  <button
                    type="button"
                    onClick={() => lockMutation.mutate(editCycle.id)}
                    disabled={lockMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                  >
                    <Lock className="size-4" />
                    Lock objectives now
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
