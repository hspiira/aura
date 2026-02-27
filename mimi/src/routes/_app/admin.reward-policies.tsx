import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowDown01,
  ArrowUp01,
  Gift,
  DollarSign,
} from 'lucide-react'
import { rewardPoliciesQueryOptions } from '#/lib/queries'
import { TablePagination } from '#/components/ui/table-pagination'

export const Route = createFileRoute('/_app/admin/reward-policies')({
  component: AdminRewardPoliciesPage,
})

function AdminRewardPoliciesPage() {
  const { data: policies = [] } = useQuery(rewardPoliciesQueryOptions())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = policies.length
  const start = (page - 1) * pageSize
  const displayPolicies = policies.slice(start, start + pageSize)
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">Reward policies</h1>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <ArrowDown01 className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Min score
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <ArrowUp01 className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Max score
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Gift className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Reward type
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Reward value
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {displayPolicies.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">{p.min_score}</td>
                <td className="px-4 py-3 text-stone-800">{p.max_score}</td>
                <td className="px-4 py-3 text-stone-600">{p.reward_type}</td>
                <td className="px-4 py-3 text-stone-600">{p.reward_value}</td>
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
