import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, SlidersHorizontal, Activity, Percent } from 'lucide-react'
import { performanceDimensionsQueryOptions, mutations } from '#/lib/queries'
import type { PerformanceDimensionCreate } from '#/lib/types'
import { TablePagination } from '#/components/ui/table-pagination'

export const Route = createFileRoute('/_app/admin/dimensions')({
  component: AdminDimensionsPage,
})

function AdminDimensionsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<PerformanceDimensionCreate>>({
    name: '',
    is_quantitative: true,
    default_weight_pct: '',
  })

  const { data: dimensions = [] } = useQuery(performanceDimensionsQueryOptions())
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
      setFormOpen(false)
      setForm({ name: '', is_quantitative: true, default_weight_pct: '' })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || form.default_weight_pct === undefined) return
    createMutation.mutate({
      name: form.name,
      is_quantitative: form.is_quantitative ?? true,
      default_weight_pct: form.default_weight_pct,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Performance dimensions</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
        >
          <Plus className="size-4" />
          Create dimension
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Name
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Activity className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Quantitative
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Percent className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Default weight %
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {displayDimensions.map((d) => (
              <tr key={d.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">{d.name}</td>
                <td className="px-4 py-3 text-stone-600">{d.is_quantitative ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-stone-600">{d.default_weight_pct}</td>
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
            <h2 className="text-lg font-semibold text-stone-900">Create dimension</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
                <input
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Default weight %</label>
                <input
                  value={form.default_weight_pct ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, default_weight_pct: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dim-q"
                  checked={form.is_quantitative ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, is_quantitative: e.target.checked }))}
                  className="rounded border-stone-200"
                />
                <label htmlFor="dim-q" className="text-sm text-stone-700">Quantitative</label>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
