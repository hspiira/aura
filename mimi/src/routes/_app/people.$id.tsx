import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Target, Users } from 'lucide-react'
import {
  userDetailQueryOptions,
  usersQueryOptions,
  rolesQueryOptions,
  departmentsQueryOptions,
  performanceCyclesQueryOptions,
  objectivesQueryOptions,
  behavioralScoresQueryOptions,
  behavioralIndicatorsQueryOptions,
  performanceSummaryByUserCycleQueryOptions,
} from '#/lib/queries'
import { useStore } from '@tanstack/react-store'
import { selectedCycleStore, setSelectedCycleId } from '#/stores/selected-cycle'
import { cn } from '#/lib/utils'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'

export const Route = createFileRoute('/_app/people/$id')({
  component: UserProfilePage,
})

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function UserProfilePage() {
  const { id } = Route.useParams()
  const cycleId = useStore(selectedCycleStore, (s) => s.cycleId)

  const { data: user, isPending: userPending } = useQuery(userDetailQueryOptions(id))
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 300 }))
  const { data: roles = [] } = useQuery(rolesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())
  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())

  const users = usersData?.items ?? []
  const effectiveCycleId = cycleId ?? cycles[0]?.id ?? ''

  const { data: objectivesData } = useQuery({
    ...objectivesQueryOptions({
      user_id: id,
      performance_cycle_id: effectiveCycleId || undefined,
      limit: 100,
    }),
    enabled: !!effectiveCycleId,
  })
  const { data: behavioralScores = [] } = useQuery({
    ...behavioralScoresQueryOptions({
      user_id: id,
      performance_cycle_id: effectiveCycleId || undefined,
    }),
    enabled: !!effectiveCycleId,
  })
  const { data: indicators = [] } = useQuery(behavioralIndicatorsQueryOptions())
  const { data: performanceSummary } = useQuery(
    performanceSummaryByUserCycleQueryOptions(id, effectiveCycleId),
    { enabled: !!effectiveCycleId },
  )

  const objectives = objectivesData?.items ?? []
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r.name]))
  const departmentById = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))
  const indicatorById = Object.fromEntries(indicators.map((i) => [i.id, i.name]))

  const directReports = users.filter((u) => u.supervisor_id === id)

  if (userPending || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/people"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" />
        Back to people
      </Link>

      <section className="grid gap-6 rounded-xl border border-stone-200 bg-white p-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-stone-100 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
          <div className="flex items-start gap-3">
            <Avatar size="lg" className="border border-stone-200">
              <AvatarFallback className="bg-stone-100 text-stone-700">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-lg font-semibold text-stone-900">
                {user.name}
              </h1>
              <p className="text-sm text-stone-600">
                {roleById[user.role_id] ?? user.role_id}
                {departmentById[user.department_id] &&
                  ` · ${departmentById[user.department_id]}`}
              </p>
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="mt-2 inline-flex items-center gap-2 rounded border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                >
                  <Mail className="size-3.5" />
                  Compose email
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Details
            </h2>
            <dl className="space-y-1.5 text-sm text-stone-700">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-stone-500">Name</dt>
                <dd className="flex-1">{user.name}</dd>
              </div>
              {user.email && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-stone-500">Email</dt>
                  <dd className="flex-1 break-all text-stone-800">{user.email}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-stone-500">Role</dt>
                <dd className="flex-1">
                  {roleById[user.role_id] ?? user.role_id}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-stone-500">Department</dt>
                <dd className="flex-1">
                  {departmentById[user.department_id] ?? user.department_id}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-stone-500">Supervisor</dt>
                <dd className="flex-1">
                  {user.supervisor_id
                    ? userById[user.supervisor_id] ?? user.supervisor_id
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Highlights</h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Snapshot of cycle, performance and team context.
              </p>
            </div>
            {cycles.length > 0 && (
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-stone-500">Cycle</span>
                <select
                  value={effectiveCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value || null)}
                  className="rounded border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-stone-800"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Summary
              </h3>
              <p className="line-clamp-3">
                {user.name} works as{' '}
                <span className="font-medium">
                  {roleById[user.role_id] ?? user.role_id}
                </span>{' '}
                in{' '}
                <span className="font-medium">
                  {departmentById[user.department_id] ?? user.department_id}
                </span>
                . They currently have {objectives.length}{' '}
                {objectives.length === 1 ? 'objective' : 'objectives'} in the
                selected cycle.
              </p>
            </div>

            <div className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Performance
              </h3>
              {performanceSummary ? (
                <dl className="space-y-1">
                  <div className="flex justify-between gap-2">
                    <dt className="text-stone-500">Final score</dt>
                    <dd className="font-medium text-stone-900">
                      {performanceSummary.final_weighted_score ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-stone-500">Rating band</dt>
                    <dd className="font-medium text-stone-900">
                      {performanceSummary.rating_band ?? '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-stone-500">
                  No performance summary for the selected cycle.
                </p>
              )}
            </div>

            <div className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Team
              </h3>
              <p>
                {directReports.length > 0 ? (
                  <>
                    Manages{' '}
                    <span className="font-medium">
                      {directReports.length} direct report
                      {directReports.length > 1 ? 's' : ''}
                    </span>
                    .
                  </>
                ) : (
                  'No direct reports.'
                )}
              </p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Activity
            </h3>
            {objectives.length === 0 && !performanceSummary ? (
              <p className="text-xs text-stone-500">
                No recent activity for this cycle yet.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-stone-700">
                {performanceSummary && (
                  <li>
                    Final performance score recorded for the selected cycle.
                  </li>
                )}
                {objectives.slice(0, 3).map((obj) => (
                  <li key={obj.id}>
                    Objective updated:{' '}
                    <Link
                      to="/objectives/$id"
                      params={{ id: obj.id }}
                      className="text-stone-900 underline-offset-2 hover:underline"
                    >
                      {obj.title}
                    </Link>
                  </li>
                ))}
                {objectives.length > 3 && (
                  <li className="text-stone-500">
                    +{objectives.length - 3} more objectives in this cycle.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Target className="size-4" />
              Objectives ({effectiveCycleId ? objectives.length : 0}) — current cycle
            </h2>
            {effectiveCycleId ? (
              objectives.length === 0 ? (
                <p className="text-sm text-stone-500">No objectives for this cycle.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {objectives.slice(0, 10).map((obj) => (
                    <li key={obj.id}>
                      <Link
                        to="/objectives/$id"
                        params={{ id: obj.id }}
                        className="text-stone-800 hover:text-amber-700"
                      >
                        {obj.title}
                      </Link>
                      <span className="ml-1.5 text-stone-400">· {obj.status}</span>
                    </li>
                  ))}
                  {objectives.length > 10 && (
                    <li className="text-stone-500">
                      +{objectives.length - 10} more
                    </li>
                  )}
                </ul>
              )
            ) : (
              <p className="text-sm text-stone-500">Select a cycle to see objectives.</p>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Behavioral scores — current cycle
            </h2>
            {effectiveCycleId ? (
              behavioralScores.length === 0 ? (
                <p className="text-sm text-stone-500">No behavioral scores.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {behavioralScores.map((bs) => (
                    <li
                      key={bs.id}
                      className="flex justify-between gap-2 border-b border-stone-50 pb-2 last:border-0"
                    >
                      <span className="text-stone-700">
                        {indicatorById[bs.indicator_id] ?? bs.indicator_id}
                      </span>
                      <span className="font-medium text-stone-800">
                        {bs.rating}
                        {bs.manager_comment && (
                          <span className="ml-1 font-normal text-stone-500">
                            · {bs.manager_comment}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="text-sm text-stone-500">Select a cycle.</p>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Performance summary — current cycle
            </h2>
            {effectiveCycleId ? (
              performanceSummary ? (
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Quantitative score</dt>
                    <dd className="font-medium text-stone-800">
                      {performanceSummary.quantitative_score ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Behavioral score</dt>
                    <dd className="font-medium text-stone-800">
                      {performanceSummary.behavioral_score ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Final weighted score</dt>
                    <dd className="font-medium text-stone-800">
                      {performanceSummary.final_weighted_score ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Rating band</dt>
                    <dd className="font-medium text-stone-800">
                      {performanceSummary.final_rating_band ?? '—'}
                    </dd>
                  </div>
                  {performanceSummary.manager_comment && (
                    <div>
                      <dt className="text-stone-500">Manager comment</dt>
                      <dd className="mt-0.5 text-stone-700">
                        {performanceSummary.manager_comment}
                      </dd>
                    </div>
                  )}
                  {performanceSummary.employee_comment && (
                    <div>
                      <dt className="text-stone-500">Employee comment</dt>
                      <dd className="mt-0.5 text-stone-700">
                        {performanceSummary.employee_comment}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-stone-500">No summary for this cycle.</p>
              )
            ) : (
              <p className="text-sm text-stone-500">Select a cycle.</p>
            )}
          </section>
        </div>

        {directReports.length > 0 && (
          <div className="space-y-4">
            <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
                <Users className="size-4" />
                Team ({directReports.length})
              </h2>
              <div className="space-y-3">
                {directReports.map((report) => (
                  <TeamMemberCard
                    key={report.id}
                    userId={report.id}
                    name={report.name}
                    cycleId={effectiveCycleId}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamMemberCard({
  userId,
  name,
  cycleId,
}: {
  userId: string
  name: string
  cycleId: string
}) {
  const { data: summary } = useQuery(
    performanceSummaryByUserCycleQueryOptions(userId, cycleId),
    { enabled: !!cycleId },
  )
  return (
    <Link
      to="/people/$id"
      params={{ id: userId }}
      className={cn(
        'block rounded-lg border border-stone-200 p-3 transition-colors hover:bg-stone-50',
      )}
    >
      <p className="font-medium text-stone-900">{name}</p>
      {summary && (
        <p className="mt-1 text-xs text-stone-500">
          Score: {summary.final_weighted_score ?? '—'} · Band: {summary.final_rating_band ?? '—'}
        </p>
      )}
    </Link>
  )
}
