'use client'

import { Clock, MoreHorizontal } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '#/components/ui/card'
import { cn } from '#/lib/utils'

const GAUGE_SIZE = 160
const STROKE = 10
const RADIUS = (GAUGE_SIZE - STROKE) / 2
const CX = GAUGE_SIZE / 2
const CY = GAUGE_SIZE / 2 + 4

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) {
  const start = (startDeg * Math.PI) / 180
  const end = (endDeg * Math.PI) / 180
  const x1 = cx + r * Math.cos(start)
  const y1 = cy + r * Math.sin(start)
  const x2 = cx + r * Math.cos(end)
  const y2 = cy + r * Math.sin(end)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

export interface SatisfactionScoreCardProps {
  score?: number
  maxScore?: number
  heading?: string
  description?: string
  className?: string
}

export function SatisfactionScoreCard({
  score = 75,
  maxScore = 100,
  heading = 'Good, Room for Improvement',
  description = 'Positive feedback is the key. Focus on faster shipping to raise satisfaction above 80.',
  className,
}: SatisfactionScoreCardProps) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100))
  const arcEnd = 180 * (pct / 100)
  const bgPath = describeArc(CX, CY, RADIUS, 180, 0)
  const fillPath = describeArc(CX, CY, RADIUS, 180, 180 - arcEnd)

  return (
    <Card
      className={cn(
        'rounded-xl border border-stone-200/80 bg-white shadow-sm',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="size-5 shrink-0 text-stone-500" />
          <CardTitle className="text-base font-semibold text-stone-900">
            Customer Satisfaction Score
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
      <CardContent className="flex flex-col gap-6 pt-0">
        <div className="flex justify-center">
          <svg
            width={GAUGE_SIZE}
            height={GAUGE_SIZE / 2 + 24}
            className="overflow-visible"
            aria-hidden
          >
            <path
              d={bgPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              className="text-stone-200"
            />
            <path
              d={fillPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              className="text-blue-500"
            />
            {[0, 25, 50, 75, 100].map((tick) => {
              const deg = 180 - (tick / 100) * 180
              const rad = (deg * Math.PI) / 180
              const x = CX + (RADIUS + STROKE / 2 + 6) * Math.cos(rad)
              const y = CY + (RADIUS + STROKE / 2 + 6) * Math.sin(rad)
              return (
                <g key={tick}>
                  <line
                    x1={CX + RADIUS * Math.cos(rad)}
                    y1={CY + RADIUS * Math.sin(rad)}
                    x2={CX + (RADIUS + 6) * Math.cos(rad)}
                    y2={CY + (RADIUS + 6) * Math.sin(rad)}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="text-stone-300"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="fill-stone-400 text-[10px] font-medium"
                  >
                    {tick === 0 || tick === 100 ? tick : ''}
                  </text>
                </g>
              )
            })}
            <text
              x={CX}
              y={CY - 4}
              textAnchor="middle"
              className="fill-stone-900 text-2xl font-bold"
            >
              {score}
            </text>
            <text
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              className="fill-stone-400 text-sm"
            >
              /{maxScore}
            </text>
          </svg>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-stone-50/80 p-3">
          <div
            className="size-8 shrink-0 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-sky-400 shadow-sm"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-semibold text-stone-900">{heading}</p>
            <p className="mt-0.5 text-sm text-stone-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
