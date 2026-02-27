import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { objectiveTemplatesQueryOptions, performanceDimensionsQueryOptions } from '#/lib/queries'

export const Route = createFileRoute('/_app/admin/templates')({
  component: AdminTemplatesPage,
})

function AdminTemplatesPage() {
  const { data: templates = [] } = useQuery(objectiveTemplatesQueryOptions())
  const { data: dimensions = [] } = useQuery(performanceDimensionsQueryOptions())
  const dimensionById = Object.fromEntries(dimensions.map((d) => [d.id, d.name]))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">Objective templates</h1>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Dimension</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">KPI type</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Default weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {templates.map((t) => (
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
      </div>
    </div>
  )
}
