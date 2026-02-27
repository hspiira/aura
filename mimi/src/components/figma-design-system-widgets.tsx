'use client'

import { Info, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '#/lib/utils'

const CARD = 'rounded-lg border border-stone-200 bg-white overflow-hidden'

const X_LABELS = ['12 AM', '8 AM', '4 PM', '11 PM']

function CardHeader({
  title,
  onViewReport,
}: {
  title: string
  onViewReport?: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-stone-900">{title}</h3>
        <button
          type="button"
          className="flex size-5 items-center justify-center rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300"
          aria-label="Information"
        >
          <Info className="size-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={onViewReport}
        className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200"
      >
        View report
      </button>
    </div>
  )
}

function TrendBadge({
  value,
  up,
}: {
  value: string
  up: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium',
        up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
      )}
    >
      {up ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {value}
    </span>
  )
}

interface BreakdownRowProps {
  label: string
  value: string
  trendPct: number
}

function BreakdownRow({ label, value, trendPct }: BreakdownRowProps) {
  const up = trendPct >= 0
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-stone-900">{value}</span>
        <TrendBadge value={`${up ? '↑' : '↓'} ${Math.abs(trendPct)}%`} up={up} />
      </div>
    </div>
  )
}

function TotalSalesCard() {
  const todayYs = [0.2, 0.5, 0.35, 0.85, 0.4, 0.9, 0.5, 0.3]
  const yesterdayYs = [0.6, 0.3, 0.25, 0.2, 0.3, 0.25, 0.2, 0.15]
  const chartW = 280
  const chartH = 120
  const pad = { top: 8, right: 8, bottom: 24, left: 8 }

  const todayPoints = useMemo(() => {
    const plotW = chartW - pad.left - pad.right
    const plotH = chartH - pad.top - pad.bottom
    return todayYs.map((y, i) => ({
      x: pad.left + (i / (todayYs.length - 1)) * plotW,
      y: pad.top + (1 - y) * plotH,
    }))
  }, [])
  const yesterdayPoints = useMemo(() => {
    const plotW = chartW - pad.left - pad.right
    const plotH = chartH - pad.top - pad.bottom
    return yesterdayYs.map((y, i) => ({
      x: pad.left + (i / (yesterdayYs.length - 1)) * plotW,
      y: pad.top + (1 - y) * plotH,
    }))
  }, [])

  const todayLineD = todayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const yesterdayLineD = yesterdayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <CardHeader title="Total Sales" />
      <div className="px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-stone-900">$82.99</span>
          <TrendBadge value="↑ 2.6%" up />
        </div>
        <div className="mt-3 divide-y divide-stone-100">
          <BreakdownRow label="Online Store" value="$50.99" trendPct={3.2} />
          <BreakdownRow label="Facebook" value="$32.00" trendPct={-7.0} />
        </div>
      </div>
      <div className="border-t border-stone-100 px-4 pb-4 pt-3">
        <svg width={chartW} height={chartH} className="overflow-visible" aria-hidden>
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={pad.left}
              y1={pad.top + t * (chartH - pad.top - pad.bottom)}
              x2={chartW - pad.right}
              y2={pad.top + t * (chartH - pad.top - pad.bottom)}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-stone-200"
            />
          ))}
          <path
            d={yesterdayLineD}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-stone-400"
          />
          <path
            d={todayLineD}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-stone-400">
          {X_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-stone-400" />
            Yesterday
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            Today
          </span>
        </div>
      </div>
    </div>
  )
}

function RepeatCustomerRateCard() {
  const firstTimeYs = [0.3, 0.8, 0.6, 0.4, 0.35, 0.3, 0.25, 0.2]
  const returningYs = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.3, 0.25]
  const chartW = 280
  const chartH = 120
  const pad = { top: 8, right: 8, bottom: 24, left: 24 }
  const yTicks = [0, 5, 10]

  const firstTimePoints = useMemo(() => {
    const plotW = chartW - pad.left - pad.right
    const plotH = chartH - pad.top - pad.bottom
    return firstTimeYs.map((y, i) => ({
      x: pad.left + (i / (firstTimeYs.length - 1)) * plotW,
      y: pad.top + (1 - y) * plotH,
    }))
  }, [])
  const returningPoints = useMemo(() => {
    const plotW = chartW - pad.left - pad.right
    const plotH = chartH - pad.top - pad.bottom
    return returningYs.map((y, i) => ({
      x: pad.left + (i / (returningYs.length - 1)) * plotW,
      y: pad.top + (1 - y) * plotH,
    }))
  }, [])

  const areaPathD = useMemo(() => {
    const pts = firstTimePoints
    const bottom = chartH - pad.bottom
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    return `${d} L ${pts[pts.length - 1].x} ${bottom} L ${pts[0].x} ${bottom} Z`
  }, [firstTimePoints])
  const firstTimeLineD = firstTimePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const returningLineD = returningPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <CardHeader title="Repeat Customer Rate" />
      <div className="px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-stone-900">5.44%</span>
          <TrendBadge value="↑ 2.6%" up />
        </div>
        <div className="mt-3 divide-y divide-stone-100">
          <BreakdownRow label="Online Store" value="$12.99" trendPct={2.2} />
          <BreakdownRow label="Facebook" value="$16.00" trendPct={-3.0} />
        </div>
      </div>
      <div className="border-t border-stone-100 px-4 pb-4 pt-3">
        <svg width={chartW} height={chartH} className="overflow-visible" aria-hidden>
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={pad.left}
              y1={pad.top + t * (chartH - pad.top - pad.bottom)}
              x2={chartW - pad.right}
              y2={pad.top + t * (chartH - pad.top - pad.bottom)}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-stone-200"
            />
          ))}
          <path d={areaPathD} fill="rgb(251 146 60 / 0.4)" />
          <path
            d={firstTimeLineD}
            fill="none"
            stroke="rgb(249 115 22)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={returningLineD}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 2"
            className="text-stone-400"
          />
          {yTicks.map((tick, i) => (
            <text
              key={tick}
              x={pad.left - 6}
              y={
                pad.top +
                (1 - i / (yTicks.length - 1)) * (chartH - pad.top - pad.bottom) +
                4
              }
              textAnchor="end"
              className="fill-stone-400 text-[10px]"
            >
              {tick}
            </text>
          ))}
        </svg>
        <div className="mt-1 flex justify-between pl-6 text-[10px] text-stone-400">
          {X_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            First Time
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-stone-400" />
            Returning
          </span>
        </div>
      </div>
    </div>
  )
}

export function FigmaDesignSystemWidgetsDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
      <TotalSalesCard />
      <RepeatCustomerRateCard />
    </div>
  )
}
