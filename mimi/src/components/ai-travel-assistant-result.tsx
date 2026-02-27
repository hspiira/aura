'use client'

import { cn } from '#/lib/utils'

const cardBase = 'border border-stone-200 bg-white'

function CardIcon() {
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center bg-stone-900"
      aria-hidden
    >
      <div className="size-2 bg-white" />
    </div>
  )
}

function ApplicationStabilityCard() {
  const pct = 67
  const totalDots = 36
  const filled = Math.round((pct / 100) * totalDots)
  const radius = 48
  const center = 56

  return (
    <div className={cn(cardBase, 'flex flex-col p-5')}>
      <div className="mb-4 flex items-start justify-between">
        <CardIcon />
      </div>
      <div className="relative mx-auto flex size-[112px] items-center justify-center">
        {/* Dot circle */}
        <svg
          viewBox="0 0 112 112"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          {Array.from({ length: totalDots }).map((_, i) => {
            const angle = (i / totalDots) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const x = center + radius * Math.cos(rad)
            const y = center + radius * Math.sin(rad)
            const isFilled = i < filled
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={4}
                fill={isFilled ? '#22c55e' : '#e5e7eb'}
              />
            )
          })}
        </svg>
        <span className="relative z-10 text-xl font-bold text-stone-900">
          {pct}%
        </span>
      </div>
      <div className="mt-4 text-center text-sm font-medium text-stone-900">
        Application Stability Index
      </div>
    </div>
  )
}

function ClientBasedFlowCard() {
  const leftVal = 0.301
  const rightVal = 0.81
  const barCount = 24
  const leftBars = barCount / 2
  const rightBars = barCount / 2

  return (
    <div className={cn(cardBase, 'flex flex-col p-5')}>
      <div className="mb-3 flex items-start justify-between">
        <CardIcon />
      </div>
      <div className="mb-3 flex gap-4 text-xs text-stone-600">
        <span>Previous Version {leftVal.toFixed(3)}</span>
        <span>Previous Version {rightVal.toFixed(3)}</span>
      </div>
      <div className="flex h-16 items-end justify-between gap-0.5">
        {Array.from({ length: leftBars }).map((_, i) => (
          <div
            key={`l-${i}`}
            className="w-1.5 bg-amber-400"
            style={{
              height: `${30 + (i / leftBars) * 40}%`,
            }}
          />
        ))}
        {Array.from({ length: rightBars }).map((_, i) => (
          <div
            key={`r-${i}`}
            className="w-1.5 bg-amber-400"
            style={{
              height: `${50 + (i / rightBars) * 50}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-4 text-center text-sm font-medium text-stone-900">
        Client Based Flow
      </div>
    </div>
  )
}

function UserEngagementCard() {
  return (
    <div className={cn(cardBase, 'flex flex-col p-5')}>
      <div className="mb-3 flex items-start justify-between">
        <CardIcon />
      </div>
      <div className="mb-4 text-center text-2xl font-bold text-stone-900">
        2.7k
      </div>
      <div className="flex h-16 items-end justify-center gap-3">
        <div
          className="w-8 bg-stone-200"
          style={{ height: '35%' }}
          aria-hidden
        />
        <div
          className="w-8 bg-emerald-500"
          style={{ height: '100%' }}
          aria-hidden
        />
      </div>
      <div className="mt-4 text-center text-sm font-medium text-stone-900">
        User engagement Index
      </div>
    </div>
  )
}

export function AiTravelAssistantResultDemo() {
  return (
    <div className="space-y-8 bg-stone-100 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <p className="text-sm text-stone-500">/09 Result.</p>
        <p className="max-w-md text-sm text-stone-600">
          As a result, we developed an AI-powered platform that helps users plan
          their travels effortlessly and efficiently.
        </p>
      </div>

      <div>
        <h2 className="max-w-2xl text-2xl font-semibold leading-snug text-stone-900 md:text-3xl">
          As a result, we created a product that lets users{' '}
          <strong>easily interact with AI</strong> to{' '}
          <strong>plan their trips effortlessly</strong>.
        </h2>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-6 text-stone-900">
          <span>
            <strong>7</strong> Sprints for project.
          </span>
          <span>
            <strong>21</strong> Screens in project.
          </span>
          <span>
            <strong>2</strong> Month of work.
          </span>
        </div>
        <p className="text-sm text-stone-600">
          Thanks for watching, Rondesignlab team.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <ApplicationStabilityCard />
        <ClientBasedFlowCard />
        <UserEngagementCard />
      </div>
    </div>
  )
}
