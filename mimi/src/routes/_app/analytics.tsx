import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Building2,
  Download,
  RefreshCw,
  User,
  Calendar,
  BarChart3,
  Award,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '#/components/ui/table'
import {
  analyticsFactSummariesQueryOptions,
  analyticsRefreshStatusQueryOptions,
  calibrationDistributionQueryOptions,
  calibrationVarianceQueryOptions,
  departmentsQueryOptions,
  mutations,
  performanceCyclesQueryOptions,
  usersQueryOptions,
} from '#/lib/queries'

export const Route = createFileRoute('/_app/analytics')({
  component: AnalyticsPage,
})

const PAGE_SIZE = 25

function AnalyticsPage() {
  const queryClient = useQueryClient()
  const [cycleId, setCycleId] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [factPage, setFactPage] = useState(0)

  const { data: cycles = [] } = useQuery(performanceCyclesQueryOptions())
  const { data: departments = [] } = useQuery(departmentsQueryOptions())
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 500 }))
  const users = usersData?.items ?? []

  const effectiveCycleId = (cycleId || cycles[0]?.id) ?? ''
  const cycleYear = effectiveCycleId
    ? (() => {
        const c = cycles.find((x) => x.id === effectiveCycleId)
        return c ? new Date(c.start_date).getFullYear() : undefined
      })()
    : undefined

  const { data: refreshStatus } = useQuery({
    ...analyticsRefreshStatusQueryOptions(),
    refetchInterval: (query) =>
      (query.state.data as { running?: boolean })?.running ? 2000 : false,
  })
  const { data: distribution = [] } = useQuery(
    calibrationDistributionQueryOptions(effectiveCycleId, departmentId || undefined),
  )
  const { data: variance = [] } = useQuery(
    calibrationVarianceQueryOptions(effectiveCycleId, departmentId || undefined),
  )
  const { data: factRows = [] } = useQuery({
    ...analyticsFactSummariesQueryOptions({
      cycle_year: cycleYear,
      department_id: departmentId || undefined,
      limit: 2000,
    }),
    enabled: cycleYear != null,
  })
  const departmentById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments],
  )
  const userById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.name])),
    [users],
  )

  const refreshMutation = useMutation({
    mutationFn: () => mutations.analytics.refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'refresh', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const paginatedFacts = useMemo(() => {
    const start = factPage * PAGE_SIZE
    return factRows.slice(start, start + PAGE_SIZE)
  }, [factRows, factPage])
  const totalPages = Math.ceil(factRows.length / PAGE_SIZE) || 1
  const maxCount = Math.max(...distribution.map((b) => b.count), 1)

  function exportCsv() {
    if (factRows.length === 0) return
    const headers = [
      'User',
      'Department',
      'Year',
      'Quant.',
      'Behavioral',
      'Final',
      'Rating',
      'ETL at',
    ]
    const escape = (s: string) =>
      /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    const rows = factRows.map((r) =>
      [
        escape(userById[r.user_id] ?? r.user_id),
        escape(departmentById[r.department_id] ?? r.department_id),
        r.cycle_year,
        r.quantitative_score ?? '',
        r.behavioral_score ?? '',
        r.final_score ?? '',
        r.rating_band ?? '',
        format(parseISO(r.etl_at), 'yyyy-MM-dd HH:mm'),
      ].join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-fact-summaries-${cycleYear ?? 'all'}-${departmentId || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Analytics</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ETLStatusBadge status={refreshStatus} />
          <button
            type="button"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || (refreshStatus?.running === true)}
            className="inline-flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${refreshMutation.isPending || refreshStatus?.running ? 'animate-spin' : ''}`}
            />
            Refresh ETL
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-stone-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Cycle</span>
          <select
            value={(cycleId || cycles[0]?.id) ?? ''}
            onChange={(e) => {
              setCycleId(e.target.value)
              setFactPage(0)
            }}
            className="border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-stone-800"
          >
            <option value="">Select…</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">Department</span>
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              setFactPage(0)
            }}
            className="border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-stone-800"
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Score distribution</h2>
          {!effectiveCycleId ? (
            <p className="text-sm text-stone-500">Select a cycle.</p>
          ) : distribution.length === 0 ? (
            <p className="text-sm text-stone-500">No distribution data. Run ETL refresh.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {distribution.map((b) => (
                <div
                  key={b.label}
                  className="flex flex-1 flex-col items-center gap-0.5"
                  title={`${b.label}: ${b.count} (${b.percentage.toFixed(1)}%)`}
                >
                  <div
                    className="w-full min-w-[8px] bg-amber-500/70 transition-all"
                    style={{ height: `${(b.count / maxCount) * 100}%` }}
                  />
                  <span className="text-[10px] font-medium text-stone-500">{b.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Department variance</h2>
          {!effectiveCycleId ? (
            <p className="text-sm text-stone-500">Select a cycle.</p>
          ) : variance.length === 0 ? (
            <p className="text-sm text-stone-500">No variance data.</p>
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead icon={<Building2 className="size-3" />}>
                      Department
                    </TableHead>
                    <TableHead icon={<BarChart3 className="size-3" />}>
                      Mean score
                    </TableHead>
                    <TableHead icon={<BarChart3 className="size-3" />}>
                      Std dev
                    </TableHead>
                    <TableHead
                      className="border-r-0"
                      icon={<AlertTriangle className="size-3" />}
                    >
                      Outlier
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {variance.map((v) => (
                    <TableRow
                      key={v.department_id}
                      className={v.is_outlier ? 'bg-red-50 hover:bg-red-100/50' : undefined}
                    >
                      <TableCell className="text-stone-800">
                        {departmentById[v.department_id] ?? v.department_id}
                      </TableCell>
                      <TableCell className="font-medium text-stone-800">
                        {v.mean_score.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {v.std_dev.toFixed(2)}
                      </TableCell>
                      <TableCell className="border-r-0">
                        {v.is_outlier ? (
                          <span className="bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Yes
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </section>
      </div>

      <section className="border border-stone-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-900">Fact summaries</h2>
          <button
            type="button"
            onClick={exportCsv}
            disabled={factRows.length === 0}
            className="inline-flex items-center gap-1.5 border border-stone-200 px-2 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
        {cycleYear == null ? (
          <p className="text-sm text-stone-500">Select a cycle to load fact summaries.</p>
        ) : factRows.length === 0 ? (
          <p className="text-sm text-stone-500">No fact rows. Run ETL refresh.</p>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead icon={<User className="size-3" />}>
                      User
                    </TableHead>
                    <TableHead icon={<Building2 className="size-3" />}>
                      Department
                    </TableHead>
                    <TableHead icon={<Calendar className="size-3" />}>
                      Year
                    </TableHead>
                    <TableHead icon={<BarChart3 className="size-3" />}>
                      Quant.
                    </TableHead>
                    <TableHead icon={<BarChart3 className="size-3" />}>
                      Behavioral
                    </TableHead>
                    <TableHead icon={<Award className="size-3" />}>
                      Final
                    </TableHead>
                    <TableHead icon={<Award className="size-3" />}>
                      Rating
                    </TableHead>
                    <TableHead
                      className="border-r-0"
                      icon={<Clock className="size-3" />}
                    >
                      ETL at
                    </TableHead>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {paginatedFacts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-stone-800">
                        {userById[r.user_id] ?? r.user_id}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {departmentById[r.department_id] ?? r.department_id}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {r.cycle_year}
                      </TableCell>
                      <TableCell className="text-stone-800">
                        {r.quantitative_score ?? '—'}
                      </TableCell>
                      <TableCell className="text-stone-800">
                        {r.behavioral_score ?? '—'}
                      </TableCell>
                      <TableCell className="text-stone-800">
                        {r.final_score ?? '—'}
                      </TableCell>
                      <TableCell className="text-stone-800">
                        {r.rating_band ?? '—'}
                      </TableCell>
                      <TableCell className="border-r-0 text-xs text-stone-500">
                        {format(parseISO(r.etl_at), 'MMM d HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <p className="text-xs text-stone-500">
                  {factPage * PAGE_SIZE + 1}–{Math.min((factPage + 1) * PAGE_SIZE, factRows.length)} of{' '}
                  {factRows.length}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFactPage((p) => Math.max(0, p - 1))}
                    disabled={factPage === 0}
                    className="rounded border border-stone-200 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={factPage >= totalPages - 1}
                    className="rounded border border-stone-200 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function ETLStatusBadge({
  status,
}: {
  status: {
    running?: boolean
    last_started_at?: string | null
    last_finished_at?: string | null
    last_upserted?: number | null
    last_error?: string | null
  } | undefined
}) {
  if (!status) return <span className="bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">Not run</span>
  if (status.running) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
        <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
        Running
      </span>
    )
  }
  if (status.last_error) {
    return (
      <span
        className="bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800"
        title={status.last_error}
      >
        Error
      </span>
    )
  }
  if (status.last_finished_at) {
    const upserted = status.last_upserted != null ? ` · ${status.last_upserted} rows` : ''
    return (
      <span
        className="bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
        title={
          `Finished ${status.last_finished_at}${upserted}` +
          (status.last_started_at ? ` (started ${status.last_started_at})` : '')
        }
      >
        OK{upserted}
      </span>
    )
  }
  return <span className="bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">Not run</span>
}
