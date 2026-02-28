import { createFileRoute, Link } from '@tanstack/react-router'

import { AiTravelAssistantResultDemo } from '#/components/ai-travel-assistant-result'
import { CrmContactCardDemo } from '#/components/crm-contact-card'
import { CrmUserTableDemo } from '#/components/crm-user-table'
import { MainUserTable } from '#/components/main-user-table'
import { DashboardWidgetsDemo } from '#/components/dashboard-widgets'
import { AppErrorPage, NotFoundPage } from '#/components/error-pages'
import { LedgerixUsabilityCardsDemo } from '#/components/ledgerix-usability-cards'
import { LedgerixUserInsightsCardsDemo } from '#/components/ledgerix-user-insights-cards'
import { MediquoWorkflowTimelineDemo } from '#/components/mediquo-workflow-timeline'
import { UiCardsReference46Demo } from '#/components/ui-cards-reference-46'
import { SprintCallRecording } from '#/components/sprint-call-recording'

export const Route = createFileRoute('/_app/components')({
  component: ComponentsPage,
})

const REFERENCE_SECTIONS = [
  {
    id: 'main-table',
    title: 'Main table – User directory',
    description:
      'Data table with User (checkbox, avatar, name), User ID, User type and Engagement score pills. Header icons, row selection.',
  },
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
    id: 'ui-cards-ref-46',
    title: 'UI Cards – Base components, profile, forms (Ref 46)',
    description:
      'Feature cards (Base/Sectoral/Figma), user profile nav, social bar, invite modal, reset password, tags, settings. No shadows, sharp corners.',
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
    <div className="space-y-8">
      <header className="flex flex-col gap-2 border-b border-stone-200 pb-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-stone-500 transition hover:text-stone-800"
          >
            ← Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Components
        </h1>
        <p className="max-w-2xl text-sm text-stone-600">
          Components built from the references. Each section maps to a design
          reference; add and refine components below.
        </p>
      </header>

      <nav
        aria-label="Sections"
        className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
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

            {section.id === 'main-table' ? (
              <MainUserTable />
            ) : section.id === 'sprint-call-recording' ? (
              <SprintCallRecording />
            ) : section.id === 'ai-travel-assistant' ? (
              <AiTravelAssistantResultDemo />
            ) : section.id === 'ledgerix-crm' ? (
              <div className="space-y-8">
                <LedgerixUsabilityCardsDemo />
                <LedgerixUserInsightsCardsDemo />
                <CrmContactCardDemo />
                <CrmUserTableDemo />
              </div>
            ) : section.id === 'error-404' ? (
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
            ) : section.id === 'dashboard-widgets' ? (
              <DashboardWidgetsDemo />
            ) : section.id === 'ui-cards-ref-46' ? (
              <UiCardsReference46Demo />
            ) : section.id === 'mediquo' ? (
              <MediquoWorkflowTimelineDemo />
            ) : (
              <div className="min-h-[120px] rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-6 text-center text-sm text-stone-500">
                Components from this reference will go here.
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
