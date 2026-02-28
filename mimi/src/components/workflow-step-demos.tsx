'use client'

import {
  AlertCircle,
  ImageIcon,
  Music2,
  Play,
  Webhook,
} from 'lucide-react'
import { WorkflowStepCard } from '#/components/workflow-step-card'

export function WorkflowStepDemos() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <WorkflowStepCard
        type="trigger"
        title="Incoming Webhook"
        icon={<Webhook className="size-5" />}
        duration="0.0 sec"
      >
        <div className="space-y-1">
          <p className="font-medium text-stone-700">POST</p>
          <p className="truncate font-mono text-xs text-stone-500">
            https://api.website.io/hooks/7f8a9...
          </p>
        </div>
      </WorkflowStepCard>

      <WorkflowStepCard
        type="trigger"
        title="Input URL"
        icon={<Webhook className="size-5" />}
        duration="0.0 sec"
      >
        <div className="flex items-center gap-2 rounded border border-stone-200 bg-white px-2 py-1.5">
          <Play className="size-4 shrink-0 fill-red-500 text-red-500" />
          <span className="truncate font-mono text-xs text-stone-600">
            https://www.youtube.com/watch?v=...
          </span>
        </div>
      </WorkflowStepCard>

      <WorkflowStepCard
        type="action"
        title="Write to Notion"
        icon={<span className="text-sm font-semibold">N</span>}
        iconContainerClassName="border-0 bg-stone-900 text-white"
        duration="0.0 sec"
      >
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50"
          >
            <span className="flex size-6 items-center justify-center rounded bg-stone-900 text-xs font-semibold text-white">
              N
            </span>
            Connect Notion Account
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            <AlertCircle className="size-3.5" />
            Account not connected
          </span>
        </div>
      </WorkflowStepCard>

      <WorkflowStepCard
        type="action"
        title="Create Customer"
        icon={<span className="text-sm font-semibold">S</span>}
        iconContainerClassName="border-0 bg-violet-600 text-white"
        duration="0.0 sec"
      >
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50"
          >
            <span className="flex size-6 items-center justify-center rounded bg-violet-600 text-xs font-semibold text-white">
              S
            </span>
            Connect Stripe Account
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            <AlertCircle className="size-3.5" />
            Account not connected
          </span>
        </div>
      </WorkflowStepCard>

      <WorkflowStepCard
        type="output"
        title="Audio Output"
        icon={<Music2 className="size-5 text-stone-600" />}
        duration="0.0 sec"
        tokens="382 Tokens"
      >
        <div className="space-y-0.5">
          <p>Eleven v3 (alpha)</p>
          <p className="text-stone-500">Sarah</p>
        </div>
      </WorkflowStepCard>

      <WorkflowStepCard
        type="output"
        title="Image Output"
        icon={<ImageIcon className="size-5 text-stone-600" />}
        duration="0.0 sec"
        tokens="382 Tokens"
      >
        <div className="space-y-0.5">
          <p>4o Image Generation</p>
          <p className="flex items-center gap-1 text-stone-500">
            1024 x 1024
            <span className="inline-block size-3.5 rounded border border-stone-300" aria-hidden />
          </p>
        </div>
      </WorkflowStepCard>
    </div>
  )
}
