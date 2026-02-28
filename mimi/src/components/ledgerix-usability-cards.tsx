'use client'

import { cn } from '#/lib/utils'

const cardBase = 'border border-stone-200 bg-white'

function UsabilityCard({
  label,
  letter,
  letterBg,
  question,
  value,
  descriptor,
  children,
}: {
  label: string
  letter: string
  letterBg: 'green' | 'black' | 'gray'
  question: string
  value: string
  descriptor: string
  children: React.ReactNode
}) {
  const bgClass =
    letterBg === 'green'
      ? 'bg-emerald-500'
      : letterBg === 'black'
        ? 'bg-stone-900'
        : 'bg-stone-300'
  return (
    <div className={cn(cardBase, 'flex flex-col p-5')}>
      <div className="mb-4 flex items-center gap-2 border border-stone-200 bg-stone-50 px-3 py-2">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center text-xs font-bold text-white',
            bgClass,
          )}
        >
          {letter}
        </span>
        <span className="text-sm font-medium text-stone-800">{label}</span>
      </div>
      <p className="mb-3 text-sm text-stone-700">{question}</p>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-stone-900">{value}</span>
        <span className="text-sm text-stone-600">{descriptor}</span>
      </div>
      <div className="mt-2 min-h-[60px]">{children}</div>
    </div>
  )
}

function ChartBar({ heightPct, filled }: { heightPct: number; filled: boolean }) {
  return (
    <div
      className={cn('w-1 flex-shrink-0', filled ? 'bg-emerald-500' : 'bg-stone-200')}
      style={{ height: `${heightPct}%` }}
    />
  )
}

function CardAUsers() {
  const barCount = 40
  const filledStart = 12
  const filledEnd = 28
  return (
    <UsabilityCard
      label="Users"
      letter="A"
      letterBg="green"
      question="How often do you use financial data now?"
      value="72%"
      descriptor="Regularly"
    >
      <div className="flex items-end justify-between gap-0.5">
        {Array.from({ length: barCount }).map((_, i) => {
          const isInGreen = i >= filledStart && i < filledEnd
          const height = isInGreen ? 70 + (i % 5) * 6 : 25 + (i % 4) * 5
          return (
            <ChartBar key={i} heightPct={height} filled={isInGreen} />
          )
        })}
      </div>
      <div className="mt-1 flex justify-center">
        <span className="text-xs font-medium text-emerald-600">72%</span>
      </div>
    </UsabilityCard>
  )
}

function CardBBusinessOwners() {
  const barCount = 44
  const unfilledIndices = [0, 1, 2, 3, 4, 40, 41, 42, 43]
  return (
    <UsabilityCard
      label="Business owners"
      letter="B"
      letterBg="black"
      question="Is the tool easy to use without financial expertise?"
      value="91%"
      descriptor="Yes"
    >
      <div className="flex items-end justify-between gap-0.5">
        {Array.from({ length: barCount }).map((_, i) => {
          const filled = !unfilledIndices.includes(i)
          const height = filled ? 85 + (i % 3) * 5 : 20 + (i % 4) * 3
          return (
            <ChartBar key={i} heightPct={height} filled={filled} />
          )
        })}
      </div>
    </UsabilityCard>
  )
}

function CardCWorkers() {
  const rows = 5
  const cols = 8
  const darkIndices = new Set([2, 5, 7, 10, 13, 15, 18, 21, 24, 27, 30, 33])
  return (
    <UsabilityCard
      label="Workers"
      letter="C"
      letterBg="gray"
      question="Has your day-to-day financial workflow improved?"
      value="84%"
      descriptor="Yes"
    >
      <div
        className="grid gap-px border border-stone-200 bg-stone-200"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'aspect-square min-h-4',
              darkIndices.has(i) ? 'bg-stone-400' : 'bg-stone-100',
            )}
          />
        ))}
      </div>
    </UsabilityCard>
  )
}

export function LedgerixUsabilityCardsDemo() {
  return (
    <div className="space-y-8 bg-stone-100 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <p className="text-sm text-stone-500">- System usability score</p>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">
            Built For Ease — Proven By Who Use
          </h2>
          <ul className="mt-2 flex gap-4 text-sm text-stone-600">
            <li>• 120+ People</li>
            <li>• 15+ interviews</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-start-2">
          <CardAUsers />
        </div>
        <div>
          <CardBBusinessOwners />
        </div>
        <div className="lg:col-start-3">
          <CardCWorkers />
        </div>
      </div>
    </div>
  )
}
