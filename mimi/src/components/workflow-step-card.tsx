'use client'

import { Circle, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

export type WorkflowStepType = 'trigger' | 'action' | 'output'

const TYPE_STYLES: Record<
  WorkflowStepType,
  { label: string; badgeClass: string; icon: ReactNode }
> = {
  trigger: {
    label: 'Trigger',
    badgeClass: 'bg-amber-100 text-amber-800',
    icon: <Zap className="size-3" />,
  },
  action: {
    label: 'Action',
    badgeClass: 'bg-blue-100 text-blue-800',
    icon: <Circle className="size-2.5 fill-current" />,
  },
  output: {
    label: 'Output',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    icon: <Circle className="size-2.5 fill-current" />,
  },
}

export interface WorkflowStepCardProps {
  type: WorkflowStepType
  title: string
  icon: ReactNode
  iconContainerClassName?: string
  children: ReactNode
  duration?: string
  tokens?: string
  className?: string
}

export function WorkflowStepCard({
  type,
  title,
  icon,
  iconContainerClassName,
  children,
  duration = '0.0 sec',
  tokens,
  className,
}: WorkflowStepCardProps) {
  const style = TYPE_STYLES[type]
  return (
    <div
      className={cn(
        'flex flex-col border border-stone-200/80 bg-stone-50/60',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
          style.badgeClass,
        )}
      >
        {style.icon}
        <span>{style.label}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center border border-stone-200 bg-white text-stone-600',
              iconContainerClassName,
            )}
          >
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        </div>
        <div className="min-h-0 flex-1 text-sm text-stone-600">{children}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-200/80 pt-3 text-xs text-stone-400">
          <span>{duration}</span>
          {tokens != null && <span>{tokens}</span>}
        </div>
      </div>
    </div>
  )
}
