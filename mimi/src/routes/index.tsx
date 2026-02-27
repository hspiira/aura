import { createFileRoute } from '@tanstack/react-router'

import logoSvg from '#/public/logo.svg'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 relative overflow-hidden">
      {/* soft warm glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,251,235,0.5),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 md:py-12 lg:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <img
              src={logoSvg}
              alt="Aura"
              className="h-7 w-7 object-contain"
            />
            <span className="font-medium tracking-tight text-stone-800">Aura</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <button className="rounded-full border border-transparent px-3 py-1 text-xs text-stone-500 transition hover:bg-stone-200/80 hover:text-stone-800">
              Product
            </button>
            <button className="rounded-full border border-transparent px-3 py-1 text-xs text-stone-500 transition hover:bg-stone-200/80 hover:text-stone-800">
              Use cases
            </button>
            <button className="rounded-full border border-transparent px-3 py-1 text-xs text-stone-500 transition hover:bg-stone-200/80 hover:text-stone-800">
              Docs
            </button>
            <button className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-medium text-stone-800 shadow-sm transition hover:bg-stone-50">
              Sign in
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="grid flex-1 items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Copy column */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl sm:leading-tight lg:text-6xl">
                Design, govern, and ship{' '}
                <span className="text-amber-700">reliable AI agents</span>.
              </h1>
              <p className="max-w-xl text-balance text-sm text-stone-600 sm:text-base">
                Aura is your control layer for complex AI workflows. Model-agnostic,
                observability-first, and built for teams that care about safety,
                latency, and the last 1% of polish.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 shadow-lg transition hover:bg-stone-800"
              >
                Start a sandbox workspace
              </a>
              <button className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm transition hover:bg-stone-50">
                <span>Watch 3‑minute overview</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 text-[10px]">
                  ▶
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-stone-500">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-800 ring-2 ring-stone-50">
                    ML
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-700 ring-2 ring-stone-50">
                    DS
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-300 text-[10px] font-semibold text-stone-800 ring-2 ring-stone-50">
                    ENG
                  </span>
                </div>
                <span className="max-w-[11rem] text-[11px] leading-snug text-stone-500">
                  Trusted by product, ML, and risk teams shipping agentic UX.
                </span>
              </div>
              <div className="flex gap-4 text-[11px]">
                <div className="space-y-0.5">
                  <p className="font-semibold text-stone-800">99.9%</p>
                  <p className="text-stone-500">workflow uptime</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-stone-800">3× faster</p>
                  <p className="text-stone-500">from idea to production</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero visualization */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-sm bg-amber-100/40 blur-2xl" />
            <div className="relative rounded-sm border border-stone-200 bg-white p-4 shadow-xl shadow-stone-200/60">
              <div className="mb-3 flex items-center justify-between gap-2 font-mono text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live agent mesh
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-600">
                  prod-us-east-1
                </span>
              </div>

              <div className="grid gap-3 text-xs md:grid-cols-[1.1fr_minmax(0,0.9fr)]">
                <div className="space-y-3">
                  <div className="rounded-sm border border-stone-100 bg-stone-50/80 p-3">
                    <p className="mb-2 font-mono text-[11px] font-medium text-stone-700">
                      Daily decision surface
                    </p>
                    <div className="flex items-end justify-between gap-1">
                      <div className="flex-1 space-y-1">
                        <div className="h-20 rounded-sm bg-gradient-to-t from-stone-200 to-amber-200/70" />
                        <div className="h-12 rounded-sm bg-gradient-to-t from-stone-100 to-amber-100/80" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-16 rounded-sm bg-gradient-to-t from-stone-200 to-emerald-200/70" />
                        <div className="h-10 rounded-sm bg-gradient-to-t from-stone-100 to-emerald-100/80" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-10 rounded-sm bg-gradient-to-t from-stone-200 to-amber-300/60" />
                        <div className="h-16 rounded-sm bg-gradient-to-t from-stone-100 to-amber-100/80" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 rounded-sm border border-stone-100 bg-stone-50/80 p-3">
                      <p className="mb-1 font-mono text-[11px] text-stone-500">Guardrails</p>
                      <p className="text-xs font-semibold text-stone-800">
                        0 critical failures
                      </p>
                      <p className="mt-1 text-[10px] text-emerald-600">
                        +18% improvement this week
                      </p>
                    </div>
                    <div className="flex-1 rounded-sm border border-stone-100 bg-stone-50/80 p-3">
                      <p className="mb-1 font-mono text-[11px] text-stone-500">
                        Latency (p95)
                      </p>
                      <p className="text-xs font-semibold text-stone-800">
                        420 ms
                      </p>
                      <p className="mt-1 text-[10px] text-stone-500">
                        Across 1.2M orchestrated steps
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-sm border border-stone-100 bg-stone-50/80 p-3">
                    <p className="mb-2 font-mono text-[11px] font-medium text-stone-700">
                      Active agents
                    </p>
                    <div className="space-y-1 text-[11px] text-stone-600">
                      <div className="flex items-center justify-between">
                        <span className="truncate">Objective planner</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                          healthy
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">Risk adjudicator</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                          throttled
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">Customer copilot</span>
                        <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] text-stone-700">
                          shipping
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-sm border border-stone-100 bg-stone-50/80 p-3">
                    <p className="mb-2 font-mono text-[11px] font-medium text-stone-700">
                      Simulation snapshot
                    </p>
                    <div className="space-y-1 text-[10px] text-stone-500">
                      <p>• 10k scenarios replayed against current policies</p>
                      <p>• Drift alerts automatically routed to owners</p>
                      <p>• Export full trace to your lake in 1 click</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
