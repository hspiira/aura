import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  FileText,
  Layers3,
  Activity,
  Percent,
  Pencil,
  Plus,
  Target,
} from 'lucide-react'
import {
  meQueryOptions,
  mutations,
  objectiveTemplatesQueryOptions,
  performanceDimensionsQueryOptions,
} from '#/lib/queries'
import { AdminDataTable } from '#/components/admin-data-table'
import { hasPermission, MANAGE_TEMPLATES } from '#/lib/permissions'
import type {
  ObjectiveTemplateCreate,
  ObjectiveTemplateResponse,
  ObjectiveTemplateUpdate,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/templates')({
  component: AdminTemplatesPage,
})

function weightDisplay(w: string | null): string {
  if (w == null || w === '') return '—'
  const n = Number(w)
  if (Number.isFinite(n) && n <= 1 && n >= 0) return `${Math.round(n * 100)}%`
  return `${w}%`
}

function AdminTemplatesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTemplate, setEditTemplate] =
    useState<ObjectiveTemplateResponse | null>(null)
  const [activeOnly, setActiveOnly] = useState(true)
  const [createForm, setCreateForm] =
    useState<Partial<ObjectiveTemplateCreate>>({
      code: '',
      title: '',
      description: '',
      dimension_id: '',
      kpi_type: '',
      default_weight: '0',
      min_target: '',
      max_target: '',
      requires_baseline_snapshot: false,
      is_active: true,
    })
  const [editForm, setEditForm] = useState<Partial<ObjectiveTemplateUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManageTemplates = hasPermission(
    me?.permissions ?? [],
    MANAGE_TEMPLATES,
  )

  const { data: templates = [] } = useQuery(objectiveTemplatesQueryOptions())
  const { data: dimensions = [] } = useQuery(
    performanceDimensionsQueryOptions(),
  )
  const dimensionById = Object.fromEntries(
    dimensions.map((d) => [d.id, d.name]),
  )

  const filteredTemplates = useMemo(
    () =>
      activeOnly ? templates.filter((t) => t.is_active) : templates,
    [templates, activeOnly],
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = filteredTemplates.length
  const start = (page - 1) * pageSize
  const displayTemplates = filteredTemplates.slice(start, start + pageSize)

  const createMutation = useMutation({
    mutationFn: (body: ObjectiveTemplateCreate) =>
      mutations.objectiveTemplates.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-templates'] })
      setCreateOpen(false)
      setCreateForm({
        code: '',
        title: '',
        description: '',
        dimension_id: '',
        kpi_type: '',
        default_weight: '0',
        min_target: '',
        max_target: '',
        requires_baseline_snapshot: false,
        is_active: true,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: ObjectiveTemplateUpdate
    }) => mutations.objectiveTemplates.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-templates'] })
      setEditTemplate(null)
      setEditForm({})
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({
      id,
      is_active,
    }: {
      id: string
      is_active: boolean
    }) =>
      mutations.objectiveTemplates.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-templates'] })
    },
  })

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.code || !createForm.title || !createForm.dimension_id)
      return
    createMutation.mutate({
      code: createForm.code,
      title: createForm.title,
      description: createForm.description || undefined,
      dimension_id: createForm.dimension_id,
      kpi_type: createForm.kpi_type || undefined,
      default_weight: createForm.default_weight ?? '0',
      min_target: createForm.min_target || undefined,
      max_target: createForm.max_target || undefined,
      requires_baseline_snapshot: createForm.requires_baseline_snapshot ?? false,
      is_active: createForm.is_active ?? true,
    })
  }

  function openEdit(t: ObjectiveTemplateResponse) {
    setEditTemplate(t)
    setEditForm({
      title: t.title,
      description: t.description ?? undefined,
      kpi_type: t.kpi_type ?? undefined,
      default_weight: t.default_weight ?? undefined,
      min_target: t.min_target ?? undefined,
      max_target: t.max_target ?? undefined,
      requires_baseline_snapshot: t.requires_baseline_snapshot,
      is_active: t.is_active,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTemplate) return
    updateMutation.mutate({
      id: editTemplate.id,
      body: {
        title: editForm.title,
        description: editForm.description ?? undefined,
        kpi_type: editForm.kpi_type ?? undefined,
        default_weight: editForm.default_weight ?? undefined,
        min_target: editForm.min_target ?? undefined,
        max_target: editForm.max_target ?? undefined,
        requires_baseline_snapshot: editForm.requires_baseline_snapshot,
        is_active: editForm.is_active,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-stone-900">Templates</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked)
                setPage(1)
              }}
              className="size-4 rounded border-stone-300"
            />
            <span className="text-stone-600">Active only</span>
          </label>
          {canManageTemplates && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
            >
              <Plus className="size-4" />
              Create template
            </button>
          )}
        </div>
      </div>
      <AdminDataTable
        rows={displayTemplates}
        columns={[
          {
            id: 'code',
            header: (
              <span className="text-xs font-semibold text-stone-700">Code</span>
            ),
            cell: (t) => (
              <span className="font-mono text-sm text-stone-800">{t.code}</span>
            ),
          },
          {
            id: 'title',
            header: (
              <div className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Title</span>
              </div>
            ),
            cell: (t) => (
              <span className="font-medium text-stone-900">{t.title}</span>
            ),
          },
          {
            id: 'dimension',
            header: (
              <div className="flex items-center gap-1.5">
                <Layers3 className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Dimension
                </span>
              </div>
            ),
            cell: (t) => (
              <span className="text-stone-600">
                {dimensionById[t.dimension_id] ?? t.dimension_id}
              </span>
            ),
          },
          {
            id: 'kpi_type',
            header: (
              <div className="flex items-center gap-1.5">
                <Activity className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  KPI type
                </span>
              </div>
            ),
            cell: (t) => (
              <span className="text-stone-600">{t.kpi_type ?? '—'}</span>
            ),
          },
          {
            id: 'default_weight',
            header: (
              <div className="flex items-center gap-1.5">
                <Percent className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Default weight%
                </span>
              </div>
            ),
            cell: (t) => (
              <span className="text-stone-600">
                {weightDisplay(t.default_weight)}
              </span>
            ),
          },
          {
            id: 'min_max',
            header: (
              <div className="flex items-center gap-1.5">
                <Target className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Min/Max target
                </span>
              </div>
            ),
            cell: (t) => (
              <span className="text-stone-600">
                {t.min_target != null || t.max_target != null
                  ? `${t.min_target ?? '—'} / ${t.max_target ?? '—'}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'requires_baseline',
            header: (
              <span className="text-xs font-semibold text-stone-700">
                Requires baseline
              </span>
            ),
            cell: (t) => (
              <span className="text-stone-600">
                {t.requires_baseline_snapshot ? 'Yes' : 'No'}
              </span>
            ),
          },
          {
            id: 'active',
            header: (
              <span className="text-xs font-semibold text-stone-700">Active</span>
            ),
            cell: (t) => (
              <span
                className={
                  t.is_active
                    ? 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                    : 'rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500'
                }
              >
                {t.is_active ? 'Yes' : 'No'}
              </span>
            ),
          },
          ...(canManageTemplates
            ? [
                {
                  id: 'actions' as const,
                  header: <span className="sr-only">Actions</span>,
                  cell: (t: ObjectiveTemplateResponse) => (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: t.id,
                            is_active: !t.is_active,
                          })
                        }
                        disabled={toggleActiveMutation.isPending}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50"
                      >
                        {t.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="inline-flex items-center justify-center text-stone-400 hover:text-amber-600"
                        aria-label={`Edit ${t.title}`}
                      >
                        <Pencil className="size-4" />
                      </button>
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
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Create template
            </h2>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Code
                </label>
                <input
                  value={createForm.code ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, code: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Title
                </label>
                <input
                  value={createForm.title ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Description
                </label>
                <textarea
                  value={createForm.description ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Dimension
                </label>
                <select
                  value={createForm.dimension_id ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, dimension_id: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {dimensions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  KPI type
                </label>
                <input
                  value={createForm.kpi_type ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, kpi_type: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Default weight
                </label>
                <input
                  type="text"
                  value={createForm.default_weight ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      default_weight: e.target.value,
                    }))
                  }
                  placeholder="0 or 0.25"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Min target
                  </label>
                  <input
                    type="text"
                    value={createForm.min_target ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        min_target: e.target.value || undefined,
                      }))
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Max target
                  </label>
                  <input
                    type="text"
                    value={createForm.max_target ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        max_target: e.target.value || undefined,
                      }))
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-requires-baseline"
                  checked={createForm.requires_baseline_snapshot ?? false}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      requires_baseline_snapshot: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="create-requires-baseline"
                  className="text-sm font-medium text-stone-700"
                >
                  Requires baseline snapshot
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-active"
                  checked={createForm.is_active ?? true}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      is_active: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="create-active"
                  className="text-sm font-medium text-stone-700"
                >
                  Active
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
      {editTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-stone-900">
              Edit template
            </h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Code
                </label>
                <p className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-600">
                  {editTemplate.code}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Title
                </label>
                <input
                  value={editForm.title ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Description
                </label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      description: e.target.value || undefined,
                    }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Dimension
                </label>
                <p className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                  {dimensionById[editTemplate.dimension_id] ??
                    editTemplate.dimension_id}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  KPI type
                </label>
                <input
                  value={editForm.kpi_type ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      kpi_type: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Default weight
                </label>
                <input
                  type="text"
                  value={editForm.default_weight ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      default_weight: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Min target
                  </label>
                  <input
                    type="text"
                    value={editForm.min_target ?? ''}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        min_target: e.target.value || undefined,
                      }))
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Max target
                  </label>
                  <input
                    type="text"
                    value={editForm.max_target ?? ''}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        max_target: e.target.value || undefined,
                      }))
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-requires-baseline"
                  checked={editForm.requires_baseline_snapshot ?? false}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      requires_baseline_snapshot: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="edit-requires-baseline"
                  className="text-sm font-medium text-stone-700"
                >
                  Requires baseline snapshot
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.is_active ?? true}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      is_active: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-stone-300"
                />
                <label
                  htmlFor="edit-active"
                  className="text-sm font-medium text-stone-700"
                >
                  Active
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
                    setEditTemplate(null)
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
