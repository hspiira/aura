import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'


export const Route = createFileRoute('/')({
  component: LandingPage,
})

// ─── Simulation data ───────────────────────────────────────────────────────────

type ObjStatus = 'ACTIVE' | 'REVIEW' | 'AT RISK' | 'COMPLETE'

interface Scenario {
  employee: string
  role: string
  cycle: string
  cycleWeek: string
  cycleProgress: number
  cycleStart: string
  cycleEnd: string
  objectives: { name: string; status: ObjStatus; weight: string; progress: number }[]
  score: number
  scoreDelta: string
  scoreDeltaUp: boolean
  recent: string[]
  weightsOk: boolean
  auditReady: boolean
}

const STATUS_COLOR: Record<ObjStatus, string> = {
  ACTIVE:   'bg-emerald-100 text-emerald-700',
  REVIEW:   'bg-amber-100 text-amber-700',
  'AT RISK':'bg-red-100 text-red-600',
  COMPLETE: 'bg-stone-100 text-stone-500',
}

const PROGRESS_COLOR: Record<ObjStatus, string> = {
  ACTIVE:   'bg-amber-500/70',
  REVIEW:   'bg-amber-400/70',
  'AT RISK':'bg-red-400/70',
  COMPLETE: 'bg-emerald-500/60',
}

// All scenarios must have exactly 4 objectives and exactly 3 recent items
// so the card never changes height — React reuses the same DOM nodes by index key.
const BLANK_OBJ = { name: '—', status: 'ACTIVE' as ObjStatus, weight: '—', progress: 0 }

const SCENARIOS: Scenario[] = [
  {
    employee: 'Sarah Mitchell',
    role: 'VP Sales — EMEA',
    cycle: 'Q1 2026 — Performance cycle',
    cycleWeek: 'Week 8 of 12',
    cycleProgress: 67,
    cycleStart: 'Jan 1',
    cycleEnd: 'Mar 31',
    objectives: [
      { name: 'Revenue target — EMEA',   status: 'ACTIVE',   weight: '35%', progress: 72 },
      { name: 'NPS improvement',         status: 'ACTIVE',   weight: '25%', progress: 48 },
      { name: 'Headcount plan',          status: 'REVIEW',   weight: '20%', progress: 90 },
      { name: 'Behavioral — Leadership', status: 'ACTIVE',   weight: '20%', progress: 60 },
    ],
    score: 81,
    scoreDelta: '+6 pts last review',
    scoreDeltaUp: true,
    recent: [
      'Objective amended · target ↑10%',
      'Baseline snapshot locked',
      'Review session scheduled',
    ],
    weightsOk: true,
    auditReady: true,
  },
  {
    employee: 'James Okafor',
    role: 'Engineering Lead — Platform',
    cycle: 'Q1 2026 — Performance cycle',
    cycleWeek: 'Week 8 of 12',
    cycleProgress: 67,
    cycleStart: 'Jan 1',
    cycleEnd: 'Mar 31',
    objectives: [
      { name: 'Platform uptime SLA 99.9%', status: 'COMPLETE', weight: '30%', progress: 100 },
      { name: 'Reduce P1 incidents',       status: 'AT RISK',  weight: '30%', progress: 22 },
      { name: 'API latency <120 ms',       status: 'ACTIVE',   weight: '25%', progress: 55 },
      { name: 'Team growth & mentoring',   status: 'REVIEW',   weight: '15%', progress: 80 },
    ],
    score: 63,
    scoreDelta: '−4 pts last review',
    scoreDeltaUp: false,
    recent: [
      'P1 incident · score impact',
      'SLA objective complete',
      'Calibration pending',
    ],
    weightsOk: true,
    auditReady: false,
  },
  {
    employee: 'Priya Nair',
    role: 'Head of Product — Growth',
    cycle: 'H1 2026 — Semi-annual cycle',
    cycleWeek: 'Week 8 of 24',
    cycleProgress: 33,
    cycleStart: 'Jan 1',
    cycleEnd: 'Jun 30',
    objectives: [
      { name: 'Launch 3 growth experiments', status: 'ACTIVE', weight: '40%', progress: 35 },
      { name: 'MAU growth +20%',             status: 'ACTIVE', weight: '35%', progress: 18 },
      { name: 'Roadmap alignment score',     status: 'REVIEW', weight: '25%', progress: 70 },
      BLANK_OBJ,
    ],
    score: 74,
    scoreDelta: '+2 pts last review',
    scoreDeltaUp: true,
    recent: [
      'Roadmap review complete',
      'Objective weight adjusted',
      'SMART check passed',
    ],
    weightsOk: true,
    auditReady: true,
  },
  {
    employee: 'Tom Reyes',
    role: 'Finance Manager — APAC',
    cycle: 'Q1 2026 — Performance cycle',
    cycleWeek: 'Week 10 of 12',
    cycleProgress: 83,
    cycleStart: 'Jan 1',
    cycleEnd: 'Mar 31',
    objectives: [
      { name: 'Budget variance <2%',        status: 'COMPLETE', weight: '40%', progress: 100 },
      { name: 'Close cycle on time',        status: 'ACTIVE',   weight: '35%', progress: 95 },
      { name: 'Cost reduction initiatives', status: 'AT RISK',  weight: '25%', progress: 30 },
      BLANK_OBJ,
    ],
    score: 88,
    scoreDelta: '+11 pts last review',
    scoreDeltaUp: true,
    recent: [
      'Budget objective closed out',
      'Score recalculated after review',
      'Audit trail exported',
    ],
    weightsOk: true,
    auditReady: true,
  },
]

// ─── Stat pill ────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-amber-600/40 pl-4">
      <p className="text-lg font-bold leading-none text-stone-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-stone-500">{label}</p>
    </div>
  )
}

// ─── Objective row (mini) ─────────────────────────────────────────────────────

function ObjectiveRow({
  name,
  status,
  weight,
  progress,
  blank = false,
}: {
  name: string
  status: ObjStatus
  weight: string
  progress: number
  blank?: boolean
}) {
  return (
    <div className={`border-b border-stone-100 py-2.5 last:border-0 transition-opacity duration-500 ${blank ? 'opacity-0' : 'opacity-100'}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-stone-700">{name}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] text-stone-400">{weight}</span>
          <span className={`text-[9px] tracking-wider px-1.5 py-0.5 ${STATUS_COLOR[status]}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="h-1 w-full bg-stone-100">
        <div
          className={`h-full transition-all duration-700 ease-in-out ${PROGRESS_COLOR[status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LandingPage() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % SCENARIOS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const s = SCENARIOS[idx]

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 relative overflow-hidden">

      {/* warm glow */}
      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,251,235,0.5),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 md:py-12 lg:px-10">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="grid flex-1 items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">

          {/* copy */}
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-700">
                Enterprise Performance Management
              </p>

              <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl sm:leading-[1.1] lg:text-6xl">
                Set goals.<br />
                Govern outcomes.<br />
                <span className="text-amber-700">Close the loop.</span>
              </h1>

              <p className="max-w-xl text-balance text-sm text-stone-500 sm:text-base">
                Aura gives HR, finance, and leadership a single platform to
                define SMART objectives, run calibrated reviews, and turn
                performance data into defensible, audit-ready decisions.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-sm bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
              >
                Request a demo
              </a>
              <button className="inline-flex items-center gap-2 rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:bg-stone-50">
                See how it works →
              </button>
            </div>

            {/* stats */}
            <div className="flex flex-wrap gap-8 pt-2">
              <Stat value="100%" label="SMART compliance enforced" />
              <Stat value="4-tier" label="calibration & governance" />
              <Stat value="Full" label="audit trail, every change" />
            </div>
          </div>

          {/* ── Dashboard mockup ───────────────────────────────────────────── */}
          <div className="relative">
            {/* grid radiating from card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-16"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(120,113,108,0.18) 1px, transparent 1px),' +
                  'linear-gradient(90deg, rgba(120,113,108,0.18) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                WebkitMaskImage:
                  'radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 75%)',
                maskImage:
                  'radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 75%)',
              }}
            />

            <div className="relative border border-stone-200/80 bg-stone-50 p-4">

              {/* mockup header */}
              <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-stone-500">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <span className="h-1.5 w-1.5 bg-emerald-500" />
                  {s.cycle}
                </span>
                <span className="border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-500">
                  In progress
                </span>
              </div>

              {/* employee */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-amber-100 text-[9px] font-bold text-amber-700">
                  {s.employee.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-stone-800">{s.employee}</p>
                  <p className="text-[10px] text-stone-400">{s.role}</p>
                </div>
              </div>

              {/* cycle progress bar */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-[10px] text-stone-400">
                  <span>{s.cycleStart}</span>
                  <span className="text-amber-600 font-medium">{s.cycleWeek}</span>
                  <span>{s.cycleEnd}</span>
                </div>
                <div className="h-1.5 w-full bg-stone-100">
                  <div
                    className="h-full bg-amber-400/80 transition-all duration-700 ease-in-out"
                    style={{ width: `${s.cycleProgress}%` }}
                  />
                </div>
              </div>

              {/* two columns */}
              <div className="grid gap-3 text-xs md:grid-cols-[2fr_1fr]">

                {/* left: objectives */}
                <div className="border border-stone-200/60 bg-transparent p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      My objectives
                    </p>
                    <span className="text-[10px] text-stone-400">
                      {s.objectives.length} of {s.objectives.length} active
                    </span>
                  </div>

                  {s.objectives.map((o, i) => (
                    <ObjectiveRow
                      key={i}
                      name={o.name}
                      status={o.status}
                      weight={o.weight}
                      progress={o.progress}
                      blank={o.name === '—'}
                    />
                  ))}
                </div>

                {/* right: score + recent */}
                <div className="flex flex-col gap-3">

                  {/* score card */}
                  <div className="border border-stone-200/60 bg-transparent p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Current score
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-stone-900">{s.score}</span>
                      <span className="mb-0.5 text-sm text-stone-400">/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-stone-100">
                      <div
                        className="h-full bg-emerald-500/70 transition-all duration-700 ease-in-out"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <p className={`mt-1.5 truncate text-[10px] ${s.scoreDeltaUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {s.scoreDeltaUp ? '↑' : '↓'} {s.scoreDelta}
                    </p>
                  </div>

                  {/* recent events */}
                  <div className="border border-stone-200/60 bg-transparent p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Recent
                    </p>
                    <div className="space-y-2 text-[10px] text-stone-500">
                      {s.recent.map((r, i) => (
                        <p key={i} className="flex items-baseline gap-1 truncate">
                          <span className="shrink-0 text-stone-400">↳</span>
                          <span className="truncate">{r}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* mockup footer */}
              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-[10px] text-stone-400">
                <span>
                  Weights: 100% {s.weightsOk ? '✓' : '✗'} — SMART validation {s.weightsOk ? 'passed' : 'failed'}
                </span>
                <span className={s.auditReady ? 'text-emerald-600' : 'text-red-500'}>
                  ● {s.auditReady ? 'Audit ready' : 'Review needed'}
                </span>
              </div>

              {/* scenario dots */}
              <div className="mt-2 flex justify-center gap-1.5">
                {SCENARIOS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${i === idx ? 'w-4 bg-amber-500' : 'w-1 bg-stone-300 hover:bg-stone-400'}`}
                    aria-label={`View scenario ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </section>
      </div>
    </main>
  )
}
