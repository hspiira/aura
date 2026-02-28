import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Mail, Target, Users } from 'lucide-react'
import { useMemo } from 'react'
import {
  behavioralIndicatorsQueryOptions,
  behavioralScoresQueryOptions,
  departmentsQueryOptions,
  objectiveScoreByObjectiveQueryOptions,
  objectivesQueryOptions,
  performanceCyclesQueryOptions,
  performanceSummaryByUserCycleQueryOptions,
  rolesQueryOptions,
  userDetailQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'
import { useStore } from '@tanstack/react-store'
import { selectedCycleStore, setSelectedCycleId } from '#/stores/selected-cycle'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/people/$id')({
  component: UserProfilePage,
})

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'draft') return 'bg-stone-100 text-stone-600'
  if (['submitted', 'in_progress', 'under_review'].some((x) => s.includes(x)))
    return 'bg-amber-100 text-amber-700'
  if (['approved', 'active', 'completed', 'scheduled'].some((x) => s.includes(x)))
    return 'bg-emerald-100 text-emerald-700'
  if (s === 'rejected' || s === 'at_risk') return 'bg-red-100 text-red-600'
  if (s === 'closed' || s === 'cancelled') return 'bg-stone-200 text-stone-500'
  return 'bg-stone-100 text-stone-600'
}

function weightDisplay(weight: string): string {
  const n = Number(weight)
  return n <= 1 && n > 0 ? `${Math.round(n * 100)}%` : `${weight}%`
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
  const { data: performanceSummary } = useQuery({
    ...performanceSummaryByUserCycleQueryOptions(id, effectiveCycleId),
  })

  const objectives = objectivesData?.items ?? []
  const scoreQueries = useQueries({
    queries: objectives.map((o) => objectiveScoreByObjectiveQueryOptions(o.id)),
  })
  const achievementByObjId = useMemo(() => {
    const m: Record<string, string> = {}
    objectives.forEach((o, i) => {
      const d = scoreQueries[i]?.data
      if (d) m[o.id] = d.achievement_percentage
    })
    return m
  }, [objectives, scoreQueries])

  const roleById = useMemo(
    () => new Map(roles.map((r) => [r.id, r.name])),
    [roles],
  )
  const departmentById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )
  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u.name])),
    [users],
  )
  const indicatorById = useMemo(
    () => new Map(indicators.map((i) => [i.id, i.name])),
    [indicators],
  )

  const directReports = useMemo(
    () => users.filter((u) => u.supervisor_id === id),
    [users, id],
  )

  const objectivesByStatus = useMemo(() => {
    const m: Record<string, number> = {}
    objectives.forEach((o) => {
      const s = o.status.toLowerCase()
      m[s] = (m[s] ?? 0) + 1
    })
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([status, count]) => `${count} ${status.replace(/_/g, ' ')}`)
      .join(', ')
  }, [objectives])

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
          <div className="flex items-start gap-4">
            <span
              className="flex size-16 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-lg font-semibold text-stone-700"
              aria-hidden
            >
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-lg font-semibold text-stone-900">
                {user.name}
              </h1>
              <p className="text-sm text-stone-600">
                {roleById.get(user.role_id) ?? user.role_id}
              </p>
              <p className="text-sm text-stone-600">
                {departmentById.get(user.department_id) ?? user.department_id}
              </p>
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="mt-2 inline-flex items-center gap-2 rounded border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                >
                  <Mail className="size-4" />
                  Email
                </a>
              )}
            </div>
          </div>

          {user.supervisor_id ? (
            <p className="text-sm">
              Supervisor:{' '}
              <Link
                to="/people/$id"
                params={{ id: user.supervisor_id }}
                className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
              >
                {userById.get(user.supervisor_id) ?? user.supervisor_id}
              </Link>
            </p>
          ) : null}
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
            <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Summary
              </h3>
              <p className="mt-1 text-sm text-stone-800">
                {objectives.length}{' '}
                {objectives.length === 1 ? 'objective' : 'objectives'}
                {objectivesByStatus ? `: ${objectivesByStatus}` : ''}
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Performance
              </h3>
              {performanceSummary ? (
                <p className="mt-1 text-sm text-stone-800">
                  {performanceSummary.final_weighted_score ?? '—'} ·{' '}
                  {performanceSummary.final_rating_band ?? '—'}
                </p>
              ) : (
                <p className="mt-1 text-sm text-stone-500">
                  No summary for this cycle.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Team
              </h3>
              <p className="mt-1 text-sm text-stone-800">
                {directReports.length} direct report
                {directReports.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Target className="size-4" />
              Objectives
            </h2>
            {!effectiveCycleId ? (
              <p className="text-sm text-stone-500">Select a cycle to see objectives.</p>
            ) : objectives.length === 0 ? (
              <p className="text-sm text-stone-500">No objectives for this cycle.</p>
            ) : (
              <>
                <ul className="space-y-2 text-sm">
                  {objectives.map((obj) => (
                    <li
                      key={obj.id}
                      className="flex flex-wrap items-center gap-2 border-b border-stone-50 pb-2 last:border-0 last:pb-0"
                    >
                      <Link
                        to="/objectives/$id"
                        params={{ id: obj.id }}
                        className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500"
                      >
                        {obj.title}
                      </Link>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(obj.status)}`}
                      >
                        {obj.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-stone-500">
                        {weightDisplay(obj.weight)}
                      </span>
                      <span className="text-stone-600">
                        {achievementByObjId[obj.id] != null
                          ? `${achievementByObjId[obj.id]}%`
                          : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/objectives"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
                >
                  View all objectives
                  <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Behavioral scores
            </h2>
            {!effectiveCycleId ? (
              <p className="text-sm text-stone-500">Select a cycle.</p>
            ) : behavioralScores.length === 0 ? (
              <p className="text-sm text-stone-500">
                No behavioral scores for this cycle.
              </p>
            ) : (
                <ul className="space-y-2 text-sm">
                  {behavioralScores.map((bs) => (
                    <li
                      key={bs.id}
                      className="flex justify-between gap-2 border-b border-stone-50 pb-2 last:border-0"
                    >
                      <span className="text-stone-700">
                        {indicatorById.get(bs.indicator_id) ?? bs.indicator_id}
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
            )}
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Performance summary
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
                  {performanceSummary.hr_approved && (
                    <p className="mt-2 inline-flex rounded px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100">
                      HR approved
                    </p>
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
  const { data: summary } = useQuery({
    ...performanceSummaryByUserCycleQueryOptions(userId, cycleId),
  })
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
