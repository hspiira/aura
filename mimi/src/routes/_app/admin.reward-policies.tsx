import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { rewardPoliciesQueryOptions } from '#/lib/queries'

export const Route = createFileRoute('/_app/admin/reward-policies')({
  component: AdminRewardPoliciesPage,
})

function AdminRewardPoliciesPage() {
  const { data: policies = [] } = useQuery(rewardPoliciesQueryOptions())
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">Reward policies</h1>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80">
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Min score</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Max score</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Reward type</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Reward value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {policies.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-medium text-stone-900">{p.min_score}</td>
                <td className="px-4 py-3 text-stone-800">{p.max_score}</td>
                <td className="px-4 py-3 text-stone-600">{p.reward_type}</td>
                <td className="px-4 py-3 text-stone-600">{p.reward_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
