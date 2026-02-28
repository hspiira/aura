import { createFileRoute } from '@tanstack/react-router'
import { AiTravelAssistantResultDemo } from '#/components/ai-travel-assistant-result'
import { DashboardWidgetsDemo } from '#/components/dashboard-widgets'
import { DeliveryDashboardDemos } from '#/components/delivery-dashboard-cards'
import { DualThemeDashboardDemo } from '#/components/dual-theme-dashboard-widgets'
import { FigmaDesignSystemWidgetsDemo } from '#/components/figma-design-system-widgets'
import { LedgerixUsabilityCardsDemo } from '#/components/ledgerix-usability-cards'
import { LedgerixUserInsightsCardsDemo } from '#/components/ledgerix-user-insights-cards'
import { MainUserTable } from '#/components/main-user-table'
import { MediquoWorkflowTimelineDemo } from '#/components/mediquo-workflow-timeline'
import { OrderBreakdownCard } from '#/components/order-breakdown-card'
import { SatisfactionScoreCard } from '#/components/satisfaction-score-card'
import { SocialMediaDashboardDemo } from '#/components/social-media-dashboard-cards'
import { UiCardsReference46Demo } from '#/components/ui-cards-reference-46'
import { WorkflowStepDemos } from '#/components/workflow-step-demos'

export const Route = createFileRoute('/_app/my-components')({
  component: MyComponentsPage,
})

function MyComponentsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">My Components</h1>
        <p className="mt-1 text-sm text-stone-500">
          Add your custom components here to preview and iterate on them.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
        <SatisfactionScoreCard />
        <OrderBreakdownCard />
      </div>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Main table – User directory
        </h2>
        <MainUserTable />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Dashboard widgets
        </h2>
        <DashboardWidgetsDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          UI cards (Ref 46)
        </h2>
        <UiCardsReference46Demo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Workflow steps
        </h2>
        <WorkflowStepDemos />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          AI Travel Assistant – Result
        </h2>
        <AiTravelAssistantResultDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Delivery dashboard (flat, no shadow)
        </h2>
        <DeliveryDashboardDemos />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Ledgerix CRM – Usability score
        </h2>
        <LedgerixUsabilityCardsDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Ledgerix CRM – User insights (Strategic Plan)
        </h2>
        <LedgerixUserInsightsCardsDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Mediquo – Design workflow (Timeline & Tools)
        </h2>
        <MediquoWorkflowTimelineDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Dual-theme dashboard widgets
        </h2>
        <DualThemeDashboardDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Social media dashboard
        </h2>
        <SocialMediaDashboardDemo />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900">
          Figma design system (KPI widgets)
        </h2>
        <FigmaDesignSystemWidgetsDemo />
      </section>
    </div>
  )
}
