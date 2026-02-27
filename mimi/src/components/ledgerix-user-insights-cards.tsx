'use client'

import { cn } from '#/lib/utils'

const cardBaseLight = 'border border-stone-200 bg-white'
const cardBaseDark = 'border border-stone-800 bg-stone-900'

function InsightCard({
  variant,
  label,
  letter,
  letterBg,
  question,
  value,
  descriptor,
  description,
  children,
}: {
  variant: 'light' | 'dark'
  label: string
  letter: string
  letterBg: 'green' | 'white' | 'gray'
  question: string
  value: string
  descriptor: string
  description: string
  children: React.ReactNode
}) {
  const isDark = variant === 'dark'
  const letterBoxClass =
    letterBg === 'green'
      ? 'bg-emerald-500 text-white'
      : letterBg === 'white'
        ? 'bg-white text-stone-900'
        : 'bg-stone-300 text-stone-800'
  const pillClass = isDark
    ? 'bg-stone-800 text-white border-stone-700'
    : 'bg-white text-stone-800 border-stone-200'
  return (
    <div
      className={cn(
        'flex flex-col p-5',
        isDark ? cardBaseDark : cardBaseLight,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center text-xs font-bold',
            letterBoxClass,
          )}
        >
          {letter}
        </span>
        <span
          className={cn(
            'border px-3 py-1 text-sm font-medium',
            pillClass,
          )}
        >
          {label}
        </span>
      </div>
      <p
        className={cn(
          'mb-3 text-sm',
          isDark ? 'text-stone-200' : 'text-stone-700',
        )}
      >
        {question}
      </p>
      <div className="mb-2 flex items-baseline gap-2">
        <span
          className={cn(
            'text-3xl font-bold',
            isDark ? 'text-white' : 'text-stone-900',
          )}
        >
          {value}
        </span>
        <span
          className={cn(
            'text-sm',
            isDark ? 'text-stone-300' : 'text-stone-600',
          )}
        >
          {descriptor}
        </span>
      </div>
      <div className="mt-2 min-h-[56px]">{children}</div>
      <p className="mt-4 flex items-start gap-2 text-sm text-emerald-600">
        <span className="mt-1.5 size-1.5 shrink-0 bg-emerald-500" />
        {description}
      </p>
    </div>
  )
}

function CardAUnclearReports() {
  const pct = 39
  const segmentCount = 40
  const filled = Math.round((pct / 100) * segmentCount)
  return (
    <InsightCard
      variant="light"
      label="Users"
      letter="A"
      letterBg="green"
      question="What makes managing your business finances most frustrating?"
      value="39%"
      descriptor="Unclear Reports"
      description="Many users shared that financial tools deliver raw numbers, but lack helpful explanations or real meaning"
    >
      <div className="relative w-full">
        <div className="flex items-end gap-0.5">
          {Array.from({ length: segmentCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-8 w-1 flex-shrink-0',
                i < filled ? 'bg-emerald-500' : 'bg-stone-200',
              )}
              style={{
                height: i < filled ? 32 : 12 + (i % 3) * 2,
              }}
            />
          ))}
        </div>
        <div
          className="absolute top-0 h-8 w-0.5 bg-stone-500"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
    </InsightCard>
  )
}

function CardBManualTracking() {
  const pct = 61
  const segmentCount = 32
  const filled = Math.round((pct / 100) * segmentCount)
  const radius = 42
  const centerX = 56
  const centerY = 56
  const startAngle = -180
  const totalAngle = 180

  return (
    <InsightCard
      variant="dark"
      label="Business owners"
      letter="B"
      letterBg="white"
      question="What do you currently use to keep track of your business finances?"
      value="61%"
      descriptor="Manual tracking"
      description="Most business owners still rely on manual input methods - often outdated and prone to errors"
    >
      <div className="relative mx-auto flex size-28 items-center justify-center">
        <svg
          viewBox="0 0 112 112"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          <g transform={`translate(${centerX}, ${centerY})`}>
            {Array.from({ length: segmentCount }).map((_, i) => {
              const angle = startAngle + (i / segmentCount) * totalAngle
              const rad = (angle * Math.PI) / 180
              const x1 = radius * Math.cos(rad)
              const y1 = radius * Math.sin(rad)
              const nextAngle = startAngle + ((i + 1) / segmentCount) * totalAngle
              const nextRad = (nextAngle * Math.PI) / 180
              const x2 = radius * Math.cos(nextRad)
              const y2 = radius * Math.sin(nextRad)
              const isFilled = i < filled
              return (
                <path
                  key={i}
                  d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                  fill={isFilled ? '#22c55e' : 'transparent'}
                  stroke={isFilled ? '#22c55e' : '#374151'}
                  strokeWidth={0.5}
                />
              )
            })}
          </g>
        </svg>
        <span className="relative z-10 text-lg font-bold text-white">61%</span>
      </div>
    </InsightCard>
  )
}

function CardCClarityGuidance() {
  const rows = 4
  const cols = 8
  const total = rows * cols
  const filledCount = Math.round(0.52 * total)
  const filledIndices = new Set(
    Array.from({ length: filledCount }, (_, i) => i),
  )

  return (
    <InsightCard
      variant="light"
      label="Workers"
      letter="C"
      letterBg="gray"
      question="What would make financial tools more helpful for your daily decisions?"
      value="52%"
      descriptor="Clarity & Guidance"
      description="More than half said they want tools that not only show the numbers - but guide their next move"
    >
      <div
        className="grid gap-px border border-stone-200 bg-stone-200"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'aspect-square min-h-6',
              filledIndices.has(i) ? 'bg-emerald-500' : 'bg-stone-100',
            )}
          />
        ))}
      </div>
    </InsightCard>
  )
}

export function LedgerixUserInsightsCardsDemo() {
  return (
    <div className="space-y-8 bg-stone-100 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <p className="text-sm text-stone-500">Strategic Plan</p>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">
            Getting Clear What Users Actually Care
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
            <li className="flex items-center gap-2">
              <span className="text-stone-400" aria-hidden>
                ◆
              </span>
              100+ Small Business Owners
            </li>
            <li className="flex items-center gap-2">
              <span className="text-stone-400" aria-hidden>
                ◆
              </span>
              40+ interviews
            </li>
            <li className="flex items-center gap-2">
              <span className="text-stone-400" aria-hidden>
                ◆
              </span>
              3 team mindsets
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CardAUnclearReports />
        <CardBManualTracking />
        <CardCClarityGuidance />
      </div>
    </div>
  )
}
