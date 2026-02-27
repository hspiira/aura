'use client'

import { BarChart3, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '#/components/ui/card'
import { cn } from '#/lib/utils'

const CHART_HEIGHT = 180
const CHART_WIDTH = 280
const Y_MAX = 2500
const Y_TICKS = [0, 500, 1000, 1500, 2000, 2500]
const Y_LABELS = ['0', '500', '1K', '1.5K', '2K', '2.5K']

export interface DayDatum {
  date: string
  label: string
  newCustomers: number
  returningCustomers: number
  newChange?: number
  returningChange?: number
}

const DEFAULT_DATA: DayDatum[] = [
  { date: '2024-08-15', label: '15 Aug', newCustomers: 980, returningCustomers: 520 },
  { date: '2024-08-16', label: '16 Aug', newCustomers: 1050, returningCustomers: 580 },
  {
    date: '2024-08-17',
    label: '17 Aug',
    newCustomers: 1120,
    returningCustomers: 631,
    newChange: 7.2,
    returningChange: -1.8,
  },
  { date: '2024-08-18', label: '18 Aug', newCustomers: 990, returningCustomers: 590 },
  { date: '2024-08-19', label: '19 Aug', newCustomers: 1100, returningCustomers: 610 },
  { date: '2024-08-20', label: '20 Aug', newCustomers: 1020, returningCustomers: 540 },
]

export interface OrderBreakdownCardProps {
  total?: number
  percentChange?: number
  data?: DayDatum[]
  highlightedDate?: string
  className?: string
}

export function OrderBreakdownCard({
  total = 8540,
  percentChange = 14.5,
  data = DEFAULT_DATA,
  highlightedDate = '2024-08-17',
  className,
}: OrderBreakdownCardProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const activeDate = hoveredDate ?? highlightedDate
  const activeDatum = data.find((d) => d.date === activeDate)

  const { bars, padding } = useMemo(() => {
    const chartPadding = { top: 8, right: 8, bottom: 24, left: 32 }
    const plotWidth = CHART_WIDTH - chartPadding.left - chartPadding.right
    const plotHeight = CHART_HEIGHT - chartPadding.top - chartPadding.bottom
    const barGap = 8
    const barWidth = (plotWidth - barGap * (data.length - 1)) / data.length
    const scaleY = (v: number) =>
      chartPadding.top + plotHeight - (v / Y_MAX) * plotHeight

    const chartBars = data.map((d, i) => {
      const totalVal = d.newCustomers + d.returningCustomers
      const x = chartPadding.left + i * (barWidth + barGap)
      const newH = (d.newCustomers / Y_MAX) * plotHeight
      const retH = (d.returningCustomers / Y_MAX) * plotHeight
      const yNew = scaleY(d.returningCustomers)
      const yRet = scaleY(totalVal)
      return {
        ...d,
        x,
        barWidth,
        yNew,
        newH,
        yRet,
        retH,
        isHighlighted: d.date === activeDate,
      }
    })
    return { bars: chartBars, padding: chartPadding }
  }, [data, activeDate])

  return (
    <Card
      className={cn(
        'rounded-xl border border-stone-200/80 bg-white shadow-sm',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 shrink-0 text-stone-500" />
          <CardTitle className="text-base font-semibold text-stone-900">
            Order Breakdown
          </CardTitle>
        </div>
        <CardAction>
          <button
            type="button"
            className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="More options"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-stone-900">
            {total.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5 text-sm font-medium text-emerald-600">
            <ChevronUp className="size-4" />
            {percentChange}% vs last month
          </span>
        </div>
        <div className="relative mt-4">
          <svg
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            className="overflow-visible"
            onMouseLeave={() => setHoveredDate(null)}
          >
            {Y_TICKS.slice(0, -1).map((tick, i) => {
              const y =
                padding.top +
                (1 - (tick / Y_MAX)) * (CHART_HEIGHT - padding.top - padding.bottom)
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={CHART_WIDTH - padding.right}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-stone-200"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-stone-400 text-[10px]"
                  >
                    {Y_LABELS[i]}
                  </text>
                </g>
              )
            })}
            {bars.map((bar) => (
              <g
                key={bar.date}
                onMouseEnter={() => setHoveredDate(bar.date)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={bar.x}
                  y={bar.yRet}
                  width={bar.barWidth}
                  height={bar.retH}
                  rx={2}
                  className={cn(
                    bar.isHighlighted ? 'fill-emerald-500' : 'fill-emerald-300',
                  )}
                />
                <rect
                  x={bar.x}
                  y={bar.yNew}
                  width={bar.barWidth}
                  height={bar.newH}
                  rx={2}
                  className={cn(
                    bar.isHighlighted ? 'fill-emerald-600' : 'fill-emerald-400',
                  )}
                />
              </g>
            ))}
          </svg>
          {activeDatum && (() => {
            const b = bars.find((x) => x.date === activeDatum.date)
            const centerX = b ? b.x + b.barWidth / 2 : CHART_WIDTH / 2
            const tooltipBottom = b ? CHART_HEIGHT - b.yNew + 8 : 0
            return (
            <div
              className="absolute flex justify-center"
              style={{
                left: centerX,
                bottom: tooltipBottom,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block size-2.5 rounded-sm bg-emerald-500"
                    aria-hidden
                  />
                  <span className="text-stone-600">New Customers</span>
                  <span className="font-semibold text-stone-900">
                    {activeDatum.newCustomers.toLocaleString()}
                  </span>
                  {activeDatum.newChange != null && (
                    <span className="flex items-center gap-0.5 font-medium text-emerald-600">
                      <ChevronUp className="size-3" />
                      +{activeDatum.newChange}%
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span
                    className="inline-block size-2.5 rounded-sm bg-emerald-300"
                    aria-hidden
                  />
                  <span className="text-stone-600">Returning</span>
                  <span className="font-semibold text-stone-900">
                    {activeDatum.returningCustomers.toLocaleString()}
                  </span>
                  {activeDatum.returningChange != null && (
                    <span className="flex items-center gap-0.5 font-medium text-red-500">
                      <ChevronDown className="size-3" />
                      {activeDatum.returningChange}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            )
          })()}
        </div>
        <div className="mt-8 flex justify-between gap-2 border-t border-stone-100 pt-4">
          {data.map((d) => (
            <span
              key={d.date}
              className={cn(
                'text-[10px] text-stone-400',
                d.date === activeDate && 'font-medium text-stone-600',
              )}
            >
              {d.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
