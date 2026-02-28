import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  BarChart2,
  Percent,
  Plus,
  SlidersHorizontal,
  SquarePen,
} from 'lucide-react'
import {
  meQueryOptions,
  mutations,
  performanceDimensionsQueryOptions,
} from '#/lib/queries'
import { hasPermission, MANAGE_DIMENSIONS } from '#/lib/permissions'
import { AdminDataTable } from '#/components/admin-data-table'
import type {
  PerformanceDimensionCreate,
  PerformanceDimensionResponse,
  PerformanceDimensionUpdate,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/dimensions')({
  component: AdminDimensionsPage,
})

function weightDisplay(w: string | null | undefined): string {
  if (w == null || w === '') return '—'
  const n = Number(w)
  if (Number.isFinite(n) && n <= 1 && n >= 0) return `${Math.round(n * 100)}%`
  return `${w}%`
}

function AdminDimensionsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editDimension, setEditDimension] =
    useState<PerformanceDimensionResponse | null>(null)
  const [createForm, setCreateForm] =
    useState<Partial<PerformanceDimensionCreate>>({
      name: '',
      is_quantitative: true,
      default_weight_pct: '',
    })
  const [editForm, setEditForm] =
    useState<Partial<PerformanceDimensionUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManageDimensions = hasPermission(
    me?.permissions ?? [],
    MANAGE_DIMENSIONS,
  )

  const { data: dimensions = [] } = useQuery(
    performanceDimensionsQueryOptions(),
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = dimensions.length
  const start = (page - 1) * pageSize
  const displayDimensions = dimensions.slice(start, start + pageSize)

  const createMutation = useMutation({
    mutationFn: (body: PerformanceDimensionCreate) =>
      mutations.performanceDimensions.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-dimensions'] })
      setCreateOpen(false)
      setCreateForm({
        name: '',
        is_quantitative: true,
        default_weight_pct: '',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: PerformanceDimensionUpdate
    }) => mutations.performanceDimensions.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-dimensions'] })
      setEditDimension(null)
      setEditForm({})
    },
  })

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.name || createForm.default_weight_pct === undefined)
      return
    createMutation.mutate({
      name: createForm.name,
      is_quantitative: createForm.is_quantitative ?? true,
      default_weight_pct:
        createForm.default_weight_pct === ''
          ? '0'
          : createForm.default_weight_pct,
    })
  }

  function openEdit(d: PerformanceDimensionResponse) {
    setEditDimension(d)
    setEditForm({
      name: d.name,
      is_quantitative: d.is_quantitative,
      default_weight_pct: d.default_weight_pct,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDimension) return
    updateMutation.mutate({
      id: editDimension.id,
      body: {
        name: editForm.name,
        is_quantitative: editForm.is_quantitative,
        default_weight_pct: editForm.default_weight_pct,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Dimensions</h1>
        {canManageDimensions && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            <Plus className="size-4" />
            Create dimension
          </button>
        )}
      </div>
      <AdminDataTable
        rows={displayDimensions}
        columns={[
          {
            id: 'name',
            icon: <SlidersHorizontal className="size-3" />,
            header: 'Name',
            cell: (d) => (
              <span className="font-medium text-stone-900">{d.name}</span>
            ),
          },
          {
            id: 'is_quantitative',
            icon: <BarChart2 className="size-3" />,
            header: 'Is quantitative',
            cell: (d) => (
              <span
                className={
                  d.is_quantitative
                    ? 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                    : 'rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600'
                }
              >
                {d.is_quantitative ? 'Yes' : 'No'}
              </span>
            ),
          },
          {
            id: 'default_weight_pct',
            icon: <Percent className="size-3" />,
            header: 'Default weight%',
            cell: (d) => (
              <span className="text-stone-600">
                {weightDisplay(d.default_weight_pct)}
              </span>
            ),
          },
          ...(canManageDimensions
            ? [
                {
                  id: 'actions' as const,
                  icon: <SquarePen className="size-3" />,
                  header: 'Edit',
                  cell: (d: PerformanceDimensionResponse) => (
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                      aria-label={`Edit ${d.name}`}
                    >
                      <SquarePen className="size-4" />
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
              Create dimension
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-quantitative"
                  checked={createForm.is_quantitative ?? true}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      is_quantitative: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="create-quantitative"
                  className="text-sm font-medium text-stone-700"
                >
                  Is quantitative
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Default weight%
                </label>
                <input
                  type="text"
                  value={createForm.default_weight_pct ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      default_weight_pct: e.target.value,
                    }))
                  }
                  placeholder="0 or 25"
                  required
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
      {editDimension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Edit dimension
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-quantitative"
                  checked={editForm.is_quantitative ?? true}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      is_quantitative: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="edit-quantitative"
                  className="text-sm font-medium text-stone-700"
                >
                  Is quantitative
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Default weight%
                </label>
                <input
                  type="text"
                  value={editForm.default_weight_pct ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      default_weight_pct: e.target.value,
                    }))
                  }
                  required
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
                    setEditDimension(null)
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
