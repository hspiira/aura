import { createFileRoute, Link } from '@tanstack/react-router'

import { CrmContactCardDemo } from '#/components/crm-contact-card'
import { CrmUserTableDemo } from '#/components/crm-user-table'
import { AppErrorPage, NotFoundPage } from '#/components/error-pages'
import { SprintCallRecording } from '#/components/sprint-call-recording'

export const Route = createFileRoute('/components')({
  component: ComponentsPage,
})

const REFERENCE_SECTIONS = [
  {
    id: 'sprint-call-recording',
    title: 'Sprint Call Recording (Light Mode)',
    description:
      'Call detail card: title, team tags with icons, attendees, audio player, AI Summary / Full Transcript tabs, expandable summary.',
  },
  {
    id: 'athletics-platform',
    title: 'Athletics Platform Startup',
    description:
      'Landing: nav, hero, CTA buttons, feature cards, tags/pills.',
  },
  {
    id: 'dual-theme-dashboard',
    title: 'Dual-Theme Dashboard Widgets',
    description:
      'Analytics summary cards (metric + trend), line chart card with period selector.',
  },
  {
    id: 'credit-loan-performance',
    title: 'Credit behavior and loan performance UI',
    description:
      'Credit score gauge, circular progress, factor list with icons.',
  },
  {
    id: 'ai-travel-assistant',
    title: 'AI Travel Assistant – SaaS Dashboard',
    description:
      'Result headline, stats bar, circular progress card, bar chart cards.',
  },
  {
    id: 'job-cards',
    title: 'Job Cards (UI Components)',
    description: 'Job card components from reference.',
  },
  {
    id: 'dashboard-widgets',
    title: 'UI UX Design – Dashboard Widgets',
    description: 'Dashboard widget set from reference.',
  },
  {
    id: 'ledgerix-crm',
    title: 'Ledgerix CRM – FMS & UX UI Dashboard',
    description: 'CRM / FMS dashboard components.',
  },
  {
    id: 'microbooks-crm',
    title: 'MicroBooks – CRM Invoicing Design Revamp',
    description: 'CRM invoicing components.',
  },
  {
    id: 'mediquo',
    title: 'Mediquo – Medical Learning App',
    description: 'Medical learning app UX/UI components.',
  },
  {
    id: 'high-conversion-landing',
    title: 'High Conversion Landing Page Design Ideas',
    description: 'Landing page components.',
  },
  {
    id: 'timekeeping-cards',
    title: 'TimeKeeping cards',
    description: 'Timekeeping card components.',
  },
  {
    id: 'social-dashboard',
    title: 'Interface Elements – Social Media Dashboard',
    description: 'Social dashboard interface elements.',
  },
  {
    id: 'error-404',
    title: '404 – Not Found',
    description:
      'Brutalist dark error page shown when a route cannot be matched. No rounded corners, no shadows.',
  },
  {
    id: 'error-500',
    title: '500 – Application Error',
    description:
      'Brutalist dark error page shown when the app throws an unhandled error. Includes stack detail and retry action.',
  },
] as const

function ComponentsPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        <header className="mb-12 flex flex-col gap-4 border-b border-stone-200 pb-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-stone-500 transition hover:text-stone-800"
            >
              ← Back to Aura
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Components
          </h1>
          <p className="max-w-2xl text-stone-600">
            Components built from the references. Each section maps to a design
            reference; add and refine components below.
          </p>
        </header>

        <nav
          aria-label="Sections"
          className="mb-12 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
            Reference sections
          </h2>
          <ul className="flex flex-wrap gap-2">
            {REFERENCE_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-block rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16">
          {REFERENCE_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-xl border border-stone-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-stone-900">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {section.description}
                </p>
              </div>

              {section.id === 'sprint-call-recording' ? (
                <SprintCallRecording />
              ) : section.id === 'ledgerix-crm' ? (
                <div className="space-y-8">
                  <CrmContactCardDemo />
                  <CrmUserTableDemo />
                </div>
              ) : section.id === 'error-404' ? (
                /* Scaled preview inside an iframe-like container */
                <div className="overflow-hidden border border-stone-200" style={{ height: 480 }}>
                  <div
                    className="origin-top-left"
                    style={{ transform: 'scale(0.6)', width: '166.67%', height: '166.67%' }}
                  >
                    <NotFoundPage />
                  </div>
                </div>
              ) : section.id === 'error-500' ? (
                <div className="overflow-hidden border border-stone-200" style={{ height: 480 }}>
                  <div
                    className="origin-top-left"
                    style={{ transform: 'scale(0.6)', width: '166.67%', height: '166.67%' }}
                  >
                    <AppErrorPage error={new Error('TypeError: Cannot read properties of undefined (reading "id")')} />
                  </div>
                </div>
              ) : (
                <div className="min-h-[120px] rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-6 text-center text-sm text-stone-500">
                  Components from this reference will go here.
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
