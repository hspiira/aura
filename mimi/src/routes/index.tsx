import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef, useState } from 'react'
import { authStore } from '#/stores/auth'

import logoSvg from '#/public/logo.svg'

const TYPEWRITER_PHRASES = [
  'Close the loop.',
  'Drive accountability.',
  'Stay audit-ready.',
]
const TYPE_MS = 55
const DELETE_MS = 40
const PAUSE_AFTER_TYPE_MS = 1800
const PAUSE_AFTER_DELETE_MS = 900

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

// ─── Stat (proof strip) ───────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-none border border-stone-200/40 border-l-2 border-l-amber-600/50 bg-stone-50/60 py-3 pl-4 pr-3 font-sans sm:py-4 sm:pl-5 sm:pr-4">
      <p className="text-lg font-bold leading-tight text-stone-900 sm:text-xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-stone-500 sm:text-[13px]">
        {label}
      </p>
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
    <div className={`border-b border-stone-200/25 py-2.5 last:border-0 transition-opacity duration-500 ${blank ? 'opacity-0' : 'opacity-100'}`}>
      <div className="mb-1.5 grid grid-cols-[1fr_auto] items-center gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-stone-700">{name}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] text-stone-400">{weight}</span>
          <span className={`rounded-none text-[10px] tracking-wider px-1.5 py-0.5 ${STATUS_COLOR[status]}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="h-1 min-w-0 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-in-out ${PROGRESS_COLOR[status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function useTypewriter(phrases: readonly string[], enabled: boolean) {
  const firstPhrase = phrases[0] ?? ''
  const [display, setDisplay] = useState(enabled ? '' : firstPhrase)
  const textRef = useRef('')
  const isDeletingRef = useRef(false)
  const phraseIndexRef = useRef(0)
  const phrasesRef = useRef(phrases)

  useEffect(() => {
    phrasesRef.current = phrases
  }, [phrases])

  useEffect(() => {
    if (!enabled) {
      setDisplay(firstPhrase)
      return
    }
    phraseIndexRef.current = 0
    const phrase = phrasesRef.current[0] ?? ''
    textRef.current = phrase
    isDeletingRef.current = false
    setDisplay(phrase)

    let timeoutId: ReturnType<typeof setTimeout>

    function step() {
      const list = phrasesRef.current
      const phrase = list[phraseIndexRef.current] ?? ''
      const cur = textRef.current
      const isDel = isDeletingRef.current

      if (!isDel) {
        if (cur.length < phrase.length) {
          textRef.current = phrase.slice(0, cur.length + 1)
          setDisplay(textRef.current)
          timeoutId = setTimeout(step, TYPE_MS)
        } else {
          // Full phrase shown; pause then start deleting
          timeoutId = setTimeout(() => {
            isDeletingRef.current = true
            step()
          }, PAUSE_AFTER_TYPE_MS)
        }
      } else {
        if (cur.length > 0) {
          textRef.current = cur.slice(0, -1)
          setDisplay(textRef.current)
          timeoutId = setTimeout(step, DELETE_MS)
        } else {
          // Advance to next phrase, then type after pause
          phraseIndexRef.current =
            (phraseIndexRef.current + 1) % list.length
          isDeletingRef.current = false
          timeoutId = setTimeout(step, PAUSE_AFTER_DELETE_MS)
        }
      }
    }

    // Show first phrase, then after pause start delete cycle
    timeoutId = setTimeout(() => {
      isDeletingRef.current = true
      step()
    }, PAUSE_AFTER_TYPE_MS)
    return () => clearTimeout(timeoutId)
  }, [enabled, firstPhrase])

  return display
}

function LandingPage() {
  const [idx, setIdx] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(true) // start true so we don't animate until we know
  const token = useStore(authStore, (s) => s.token)
  const navigate = useNavigate()

  useEffect(() => {
    setReduceMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
  }, [])

  const typewriterText = useTypewriter(TYPEWRITER_PHRASES, !reduceMotion)

  useEffect(() => {
    if (token) {
      navigate({ to: '/reviews' })
    }
  }, [token, navigate])

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % SCENARIOS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const s = SCENARIOS[idx]

  if (token) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between px-6 py-4 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-stone-800 hover:text-stone-900 transition-colors"
        >
          <img src={logoSvg} alt="Aura" className="h-11 w-11 sm:h-12 sm:w-12" />
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center">

      {/* warm glow */}
      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,251,235,0.5),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pt-16 pb-16 sm:px-5 sm:pt-20 sm:pb-20 md:pt-24 md:pb-24 lg:px-6">
        {/* ── Hero: message + preview ─────────────────────────────────────── */}
        <section className="grid flex-1 items-start gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-16">
          {/* Left: value prop and CTAs only — fixed max so right card gets remaining space */}
          <div className="flex flex-col gap-8 lg:pt-2">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl sm:leading-[1.1] lg:text-6xl">
              Set goals.
              <br />
              Govern outcomes.
              <br />
              <span
                className="inline-block min-w-[21ch] text-amber-700"
                aria-live="polite"
                aria-label={TYPEWRITER_PHRASES.join(' ')}
              >
                {typewriterText}
                {!reduceMotion && (
                  <span className="animate-pulse" aria-hidden>
                    |
                  </span>
                )}
              </span>
            </h1>
            <p className="max-w-lg text-balance text-sm text-stone-500 sm:text-base">
              Aura gives HR, finance, and leadership a single platform to
              define SMART objectives, run calibrated reviews, and turn
              performance data into defensible, audit-ready decisions.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="group inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                <span>See how it works</span>
                <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Right: product preview — takes all remaining space so card isn't squeezed */}
          <div className="relative flex min-w-0 flex-col items-start">
            <div className="relative w-full min-w-0">
              {/* grid mesh behind card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-16"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(120,113,108,0.2) 1px, transparent 1px),' +
                    'linear-gradient(90deg, rgba(120,113,108,0.2) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  WebkitMaskImage:
                    'radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 75%)',
                  maskImage:
                    'radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 75%)',
                }}
              />

              <div className="relative overflow-hidden rounded-none border border-stone-200/20 bg-white/20 p-6 shadow-sm backdrop-blur-md">

              {/* mockup header */}
              <div className="mb-3 flex items-center justify-between gap-2 text-xs text-stone-500">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <span className="h-1.5 w-1.5 rounded-none bg-emerald-500" />
                  {s.cycle}
                </span>
                <span className="rounded-none border border-stone-200/25 bg-white/30 px-2 py-0.5 text-[11px] text-stone-500">
                  In progress
                </span>
              </div>

              {/* employee */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                  {s.employee.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-800">{s.employee}</p>
                  <p className="text-[11px] text-stone-400">{s.role}</p>
                </div>
              </div>

              {/* cycle progress bar */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-[11px] text-stone-400">
                  <span>{s.cycleStart}</span>
                  <span className="text-amber-600 font-medium">{s.cycleWeek}</span>
                  <span>{s.cycleEnd}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-amber-400/80 transition-all duration-700 ease-in-out"
                    style={{ width: `${s.cycleProgress}%` }}
                  />
                </div>
              </div>

              {/* two columns */}
              <div className="grid min-w-0 gap-3 text-sm md:grid-cols-[2fr_1fr]">
                {/* left: objectives */}
                <div className="min-w-0 rounded-none border border-stone-300/40 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold tracking-wide text-stone-500">
                      My objectives
                    </p>
                    <span className="text-[11px] text-stone-400">
                      {s.objectives.length} of {s.objectives.length} active
                    </span>
                  </div>

                  <div className="space-y-0">
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
                </div>

                {/* right: score + recent */}
                <div className="flex min-w-0 flex-col gap-3">
                  {/* score card */}
                  <div className="min-w-0 rounded-none border border-stone-300/40 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-stone-500">
                      Current score
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-stone-900">{s.score}</span>
                      <span className="mb-0.5 text-base text-stone-400">/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-emerald-500/70 transition-all duration-700 ease-in-out"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <p className={`mt-1.5 truncate text-[11px] ${s.scoreDeltaUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {s.scoreDeltaUp ? '↑' : '↓'} {s.scoreDelta}
                    </p>
                  </div>

                  {/* recent events */}
                  <div className="min-w-0 rounded-none border border-stone-300/40 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-stone-500">
                      Recent
                    </p>
                    <div className="space-y-2 text-[11px] text-stone-500">
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
              <div className="mt-3 flex items-center justify-between border-t border-stone-200/20 pt-3 text-[11px] text-stone-400">
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
                    className={`h-1 rounded-none transition-all duration-300 ${i === idx ? 'w-4 bg-amber-500' : 'w-1 bg-stone-300 hover:bg-stone-400'}`}
                    aria-label={`View scenario ${i + 1}`}
                  />
                ))}
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* ── Proof strip: stats below the hero ────────────────────────────── */}
        <section className="mt-16 border-t border-stone-200/80 pt-10 sm:mt-20 sm:pt-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <Stat value="100%" label="SMART compliance enforced" />
            <Stat value="4-tier" label="calibration & governance" />
            <Stat value="Full" label="audit trail, every change" />
          </div>
        </section>
      </div>
      </main>
    </div>
  )
}
