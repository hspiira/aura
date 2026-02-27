import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { MainCycleTable } from '#/components/main-cycle-table'
import { performanceCyclesQueryOptions } from '#/lib/queries'

export const Route = createFileRoute('/_app/cycles')({
  component: CyclesPage,
})

function CyclesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isListPage = pathname === '/cycles'

  const { data: cycles = [], isPending } = useQuery(performanceCyclesQueryOptions())

  return (
    <div className="space-y-4">
      {isListPage && (
        <>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">
              Performance cycles
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">
              View cycles and manage objectives by cycle.
            </p>
          </div>

          <MainCycleTable data={cycles} isPending={isPending} />
        </>
      )}
      <Outlet />
    </div>
  )
}
