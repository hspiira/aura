import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  FileText,
  Layers3,
  Activity,
  Percent,
} from 'lucide-react'
import { objectiveTemplatesQueryOptions, performanceDimensionsQueryOptions } from '#/lib/queries'
import { TablePagination } from '#/components/ui/table-pagination'

export const Route = createFileRoute('/_app/admin/templates')({
  component: AdminTemplatesPage,
})

function AdminTemplatesPage() {
  const { data: templates = [] } = useQuery(objectiveTemplatesQueryOptions())
  const { data: dimensions = [] } = useQuery(performanceDimensionsQueryOptions())
  const dimensionById = Object.fromEntries(dimensions.map((d) => [d.id, d.name]))

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = templates.length
  const start = (page - 1) * pageSize
  const displayTemplates = templates.slice(start, start + pageSize)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">Objective templates</h1>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Title
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Layers3 className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Dimension
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Activity className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    KPI type
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Percent className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Default weight
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {displayTemplates.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">{t.title}</td>
                <td className="px-4 py-3 text-stone-600">
                  {dimensionById[t.dimension_id] ?? t.dimension_id}
                </td>
                <td className="px-4 py-3 text-stone-600">{t.kpi_type ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">{t.default_weight ?? '—'}</td>
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
    </div>
  )
}
