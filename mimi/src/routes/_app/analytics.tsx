import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-stone-900">Analytics</h1>
      <p className="mt-1 text-sm text-stone-500">Reports and fact summaries.</p>
    </div>
  )
}
