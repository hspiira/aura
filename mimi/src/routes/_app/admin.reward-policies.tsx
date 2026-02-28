import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowDown01,
  ArrowUp01,
  DollarSign,
  Gift,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  meQueryOptions,
  mutations,
  rewardPoliciesQueryOptions,
} from '#/lib/queries'
import { hasPermission, MANAGE_REWARD_POLICY } from '#/lib/permissions'
import { AdminDataTable } from '#/components/admin-data-table'
import type {
  RewardPolicyCreate,
  RewardPolicyResponse,
  RewardPolicyUpdate,
} from '#/lib/types'

export const Route = createFileRoute('/_app/admin/reward-policies')({
  component: AdminRewardPoliciesPage,
})

const BAND_COLORS = [
  'bg-rose-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-sky-400',
  'bg-violet-400',
]

function BandedScaleBar({ policies }: { policies: RewardPolicyResponse[] }) {
  if (policies.length === 0) return null
  const mins = policies.map((p) => Number(p.min_score))
  const maxs = policies.map((p) => Number(p.max_score))
  const globalMin = Math.min(0, ...mins)
  const globalMax = Math.max(100, ...maxs)
  const range = globalMax - globalMin
  if (range <= 0) return null
  return (
    <div className="border border-stone-200 bg-stone-50 p-3">
      <p className="mb-2 text-xs font-medium text-stone-500">
        Score brackets
      </p>
      <div className="relative h-6 w-full overflow-hidden border border-stone-200 bg-white">
        {policies.map((p, i) => {
          const left =
            ((Number(p.min_score) - globalMin) / range) * 100
          const width =
            ((Number(p.max_score) - Number(p.min_score)) / range) * 100
          return (
            <div
              key={p.id}
              className={`absolute inset-y-0 border-r border-white/50 ${BAND_COLORS[i % BAND_COLORS.length]}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${p.min_score}–${p.max_score}: ${p.reward_type}`}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-stone-400">
        <span>{globalMin}</span>
        <span>{globalMax}</span>
      </div>
    </div>
  )
}

function AdminRewardPoliciesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editPolicy, setEditPolicy] = useState<RewardPolicyResponse | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<Partial<RewardPolicyCreate>>({
    min_score: '',
    max_score: '',
    reward_type: '',
    reward_value: '',
  })
  const [editForm, setEditForm] = useState<Partial<RewardPolicyUpdate>>({})

  const { data: me } = useQuery(meQueryOptions())
  const canManage = hasPermission(
    me?.permissions ?? [],
    MANAGE_REWARD_POLICY,
  )

  const { data: policies = [] } = useQuery(rewardPoliciesQueryOptions())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = policies.length
  const start = (page - 1) * pageSize
  const displayPolicies = policies.slice(start, start + pageSize)

  const createMutation = useMutation({
    mutationFn: (body: RewardPolicyCreate) =>
      mutations.rewardPolicies.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-policies'] })
      setCreateOpen(false)
      setCreateForm({
        min_score: '',
        max_score: '',
        reward_type: '',
        reward_value: '',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: { id: string; body: RewardPolicyUpdate }) =>
      mutations.rewardPolicies.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-policies'] })
      setEditPolicy(null)
      setEditForm({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mutations.rewardPolicies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-policies'] })
      setDeleteConfirmId(null)
    },
  })

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      createForm.min_score === undefined ||
      createForm.max_score === undefined ||
      !createForm.reward_type ||
      createForm.reward_value === undefined
    )
      return
    createMutation.mutate({
      min_score: createForm.min_score,
      max_score: createForm.max_score,
      reward_type: createForm.reward_type,
      reward_value: createForm.reward_value,
    })
  }

  function openEdit(p: RewardPolicyResponse) {
    setEditPolicy(p)
    setEditForm({
      min_score: p.min_score,
      max_score: p.max_score,
      reward_type: p.reward_type,
      reward_value: p.reward_value,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editPolicy) return
    updateMutation.mutate({
      id: editPolicy.id,
      body: {
        min_score: editForm.min_score,
        max_score: editForm.max_score,
        reward_type: editForm.reward_type,
        reward_value: editForm.reward_value,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">
          Reward policies
        </h1>
        {canManage && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
          >
            <Plus className="size-4" />
            Create policy
          </button>
        )}
      </div>
      <BandedScaleBar policies={policies} />
      <AdminDataTable
        rows={displayPolicies}
        columns={[
          {
            id: 'min',
            header: (
              <div className="flex items-center gap-1.5">
                <ArrowDown01 className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Min score
                </span>
              </div>
            ),
            cell: (p) => (
              <span className="font-medium text-stone-900">{p.min_score}</span>
            ),
          },
          {
            id: 'max',
            header: (
              <div className="flex items-center gap-1.5">
                <ArrowUp01 className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Max score
                </span>
              </div>
            ),
            cell: (p) => <span className="text-stone-800">{p.max_score}</span>,
          },
          {
            id: 'type',
            header: (
              <div className="flex items-center gap-1.5">
                <Gift className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Reward type
                </span>
              </div>
            ),
            cell: (p) => (
              <span className="text-stone-600">{p.reward_type}</span>
            ),
          },
          {
            id: 'value',
            header: (
              <div className="flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">
                  Reward value
                </span>
              </div>
            ),
            cell: (p) => (
              <span className="text-stone-600">{p.reward_value}</span>
            ),
          },
          ...(canManage
            ? [
                {
                  id: 'actions' as const,
                  header: <span className="sr-only">Edit / Delete</span>,
                  cell: (p: RewardPolicyResponse) => (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1 text-stone-400 hover:bg-stone-100 hover:text-amber-600"
                        aria-label={`Edit ${p.reward_type}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      {deleteConfirmId === p.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              deleteMutation.mutate(p.id)
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
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${p.reward_type}`}
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
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border border-stone-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-stone-900">
              Create policy
            </h2>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Min score
                </label>
                <input
                  type="text"
                  value={createForm.min_score ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, min_score: e.target.value }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Max score
                </label>
                <input
                  type="text"
                  value={createForm.max_score ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, max_score: e.target.value }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Reward type
                </label>
                <input
                  type="text"
                  value={createForm.reward_type ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      reward_type: e.target.value,
                    }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Reward value
                </label>
                <input
                  type="text"
                  value={createForm.reward_value ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      reward_value: e.target.value,
                    }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
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
          </div>
        </div>
      )}
      {editPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border border-stone-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-stone-900">
              Edit policy
            </h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Min score
                </label>
                <input
                  type="text"
                  value={editForm.min_score ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, min_score: e.target.value }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Max score
                </label>
                <input
                  type="text"
                  value={editForm.max_score ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, max_score: e.target.value }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Reward type
                </label>
                <input
                  type="text"
                  value={editForm.reward_type ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      reward_type: e.target.value,
                    }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Reward value
                </label>
                <input
                  type="text"
                  value={editForm.reward_value ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      reward_value: e.target.value,
                    }))
                  }
                  required
                  className="w-full border border-stone-200 px-3 py-2 text-sm"
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
                    setEditPolicy(null)
                    setEditForm({})
                  }}
                  className="border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
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
