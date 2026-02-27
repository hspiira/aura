import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Plus,
  Calendar,
  Hash,
  CheckCircle2,
} from 'lucide-react'
import { TablePagination } from '#/components/ui/table-pagination'
import { performanceCyclesQueryOptions, mutations } from '#/lib/queries'
import type { PerformanceCycleCreate } from '#/lib/types'

export const Route = createFileRoute('/_app/admin/cycles')({
  component: AdminCyclesPage,
})

function AdminCyclesPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<PerformanceCycleCreate>>({
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft',
  })

  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = cycles.length
  const start = (page - 1) * pageSize
  const displayCycles = cycles.slice(start, start + pageSize)
  const createMutation = useMutation({
    mutationFn: (body: PerformanceCycleCreate) => mutations.performanceCycles.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
      setFormOpen(false)
      setForm({ name: '', start_date: '', end_date: '', status: 'draft' })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.start_date || !form.end_date) return
    createMutation.mutate({
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status ?? 'draft',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">Performance cycles</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800"
        >
          <Plus className="size-4" />
          Create cycle
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Name
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Dates
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Status
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {displayCycles.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">{c.name}</td>
                <td className="px-4 py-3 text-stone-600">
                  {format(parseISO(c.start_date), 'MMM d')} – {format(parseISO(c.end_date), 'MMM d')}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs capitalize text-stone-700">
                    {c.status}
                  </span>
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
            <h2 className="text-lg font-semibold text-stone-900">Create cycle</h2>
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
                <label className="mb-1 block text-sm font-medium text-stone-700">Start date</label>
                <input
                  type="date"
                  value={form.start_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">End date</label>
                <input
                  type="date"
                  value={form.end_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  required
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
