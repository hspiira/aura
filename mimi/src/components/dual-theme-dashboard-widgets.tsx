'use client'

import {
  Clock,
  Droplets,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '#/lib/utils'

const CARD_BASE =
  'rounded-lg border border-stone-200 bg-white overflow-hidden'

interface KpiMetricProps {
  title: string
  value: string
  changePct: number
  changeLabel?: string
  icon: React.ReactNode
  iconBgClass: string
  iconBorderClass: string
}

function KpiMetric({
  title,
  value,
  changePct,
  changeLabel = 'VS PREV. 28 DAYS',
  icon,
  iconBgClass,
  iconBorderClass,
}: KpiMetricProps) {
  const isPositive = changePct >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-stone-600">{title}</span>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border',
            iconBgClass,
            iconBorderClass,
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-stone-900">{value}</p>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          isPositive ? 'text-emerald-600' : 'text-red-600',
        )}
      >
        <TrendIcon className="size-3.5" />
        {Math.abs(changePct)}% {changeLabel}
      </span>
    </div>
  )
}

function KpiMetricsCard() {
  return (
    <div
      className={cn(
        CARD_BASE,
        'grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x',
      )}
    >
      <KpiMetric
        title="New Users"
        value="1.39K"
        changePct={147}
        icon={<Users className="size-4 text-rose-500" />}
        iconBgClass="bg-rose-50"
        iconBorderClass="border-rose-200"
      />
      <KpiMetric
        title="Unique Users"
        value="1.52K"
        changePct={53}
        icon={<Star className="size-4 text-emerald-500" />}
        iconBgClass="bg-emerald-50"
        iconBorderClass="border-emerald-200"
      />
      <KpiMetric
        title="Week 1 Retention"
        value="4.53%"
        changePct={-10.7}
        icon={<Droplets className="size-4 text-blue-500" />}
        iconBgClass="bg-blue-50"
        iconBorderClass="border-blue-200"
      />
      <KpiMetric
        title="Session"
        value="0.9 sec"
        changePct={29}
        icon={<Clock className="size-4 text-amber-500" />}
        iconBgClass="bg-amber-50"
        iconBorderClass="border-amber-200"
      />
    </div>
  )
}

const VIEWS_X_LABELS = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM']
const VIEWS_Y_MAX = 2500
const VIEWS_AVG = 1800

function ViewsChartCard() {
  const [period, setPeriod] = useState<'Day' | 'Week' | 'Month'>('Day')
  const chartWidth = 520
  const chartHeight = 180
  const padding = { top: 12, right: 12, bottom: 28, left: 40 }

  const points = useMemo(() => {
    const xs = [0, 0.2, 0.35, 0.5, 0.7, 0.85, 1]
    const ys = [0.3, 0.6, 0.5, 0.9, 0.7, 0.85, 0.75]
    const plotW = chartWidth - padding.left - padding.right
    const plotH = chartHeight - padding.top - padding.bottom
    return xs.map((x, i) => ({
      x: padding.left + x * plotW,
      y: padding.top + (1 - ys[i]) * plotH,
    }))
  }, [])

  const pathD = useMemo(() => {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    d.push(`L ${points[points.length - 1].x} ${chartHeight - padding.bottom}`)
    d.push(`L ${points[0].x} ${chartHeight - padding.bottom}`)
    d.push('Z')
    return d.join(' ')
  }, [points])

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const avgY =
    padding.top +
    (1 - VIEWS_AVG / VIEWS_Y_MAX) * (chartHeight - padding.top - padding.bottom)

  return (
    <div className={cn(CARD_BASE, 'flex flex-col')}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-4 py-4">
        <div>
          <p className="text-sm font-medium text-stone-600">Views</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">12.7K</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="size-3.5" />
              2.6% VS PREV. DAY
            </span>
          </div>
        </div>
        <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
          {(['Day', 'Week', 'Month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                period === p
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible"
          aria-hidden
        >
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={padding.left}
              y1={padding.top + t * (chartHeight - padding.top - padding.bottom)}
              x2={chartWidth - padding.right}
              y2={padding.top + t * (chartHeight - padding.top - padding.bottom)}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-stone-200"
            />
          ))}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={padding.left + t * (chartWidth - padding.left - padding.right)}
              y1={padding.top}
              x2={padding.left + t * (chartWidth - padding.left - padding.right)}
              y2={chartHeight - padding.bottom}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-stone-200"
            />
          ))}
          <path d={pathD} fill="rgb(59 130 246 / 0.2)" />
          <path
            d={lineD}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1={padding.left}
            y1={avgY}
            x2={chartWidth - padding.right}
            y2={avgY}
            stroke="rgb(234 179 8)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text
            x={chartWidth - padding.right - 28}
            y={avgY - 4}
            className="fill-amber-600 text-[10px] font-medium"
          >
            AVG
          </text>
          {VIEWS_X_LABELS.map((label, i) => (
            <text
              key={label}
              x={
                padding.left +
                (i / (VIEWS_X_LABELS.length - 1)) *
                  (chartWidth - padding.left - padding.right)
              }
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-stone-400 text-[10px]"
            >
              {label}
            </text>
          ))}
          {['2.5K', '1.5K', '0'].map((tick, i) => (
            <text
              key={tick}
              x={padding.left - 6}
              y={
                padding.top +
                (1 - i / 2) * (chartHeight - padding.top - padding.bottom) +
                4
              }
              textAnchor="end"
              className="fill-stone-400 text-[10px]"
            >
              {tick}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export function DualThemeDashboardDemo() {
  return (
    <div className="flex flex-col gap-4">
      <KpiMetricsCard />
      <ViewsChartCard />
    </div>
  )
}
