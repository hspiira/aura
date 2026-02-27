'use client'

import {
  FileText,
  Home,
  Percent,
  Pencil,
  User,
  GitBranch,
  Check,
} from 'lucide-react'
import { cn } from '#/lib/utils'

const cardBaseLight = 'border border-stone-200 bg-white'
const cardBaseDark = 'border border-stone-800 bg-stone-900'

const steps = [
  {
    id: 1,
    duration: 3,
    title: 'Discovery & Research',
    description:
      "Competitor analysis & research focused on medical students' routines, content habits, and study workflows.",
    icon: User,
    dark: false,
    tools: [
      { label: 'Notion', bg: 'bg-violet-600', letter: 'N' },
      { label: 'Figma', bg: 'bg-white border border-stone-200', letter: 'F', textDark: true },
    ],
  },
  {
    id: 2,
    duration: 7,
    title: 'Information Architecture & Content Strategy',
    description:
      'Organized full content and categorized all materials for easier browsing.',
    icon: FileText,
    dark: false,
    tools: [
      { label: 'Notion', bg: 'bg-violet-600', letter: 'N' },
      { label: 'Tool', bg: 'bg-stone-200', letter: '', textDark: true },
      { label: 'Miro', bg: 'bg-amber-400', letter: 'M', textDark: true },
    ],
  },
  {
    id: 3,
    duration: 14,
    title: 'UX Flow & Wireframes',
    description:
      'Created wireframes to define navigation, screen logic, and key user flows across all main sections and features.',
    icon: Percent,
    dark: false,
    tools: [
      { label: 'Notion', bg: 'bg-violet-600', letter: 'N' },
      { label: 'Figma', bg: 'bg-white border border-stone-200', letter: 'F', textDark: true },
    ],
  },
  {
    id: 4,
    duration: 5,
    title: 'UI Design System',
    description:
      'Designed a flexible UI system with clean layouts and a calm visual tone.',
    icon: Pencil,
    dark: false,
    tools: [
      { label: 'Figma', bg: 'bg-red-500', letter: 'F' },
      { label: 'Design', bg: 'bg-gradient-to-br from-violet-400 via-amber-400 to-emerald-400', letter: '', textDark: true },
    ],
  },
  {
    id: 5,
    duration: 14,
    title: 'Iteration & Feedback Integration',
    description:
      'Reviewed the design and gathered feedback. Updated card layouts, button placement, and screen structure for better clarity. Simplified overcrowded areas.',
    icon: GitBranch,
    dark: false,
    tools: [
      { label: 'Jira', bg: 'bg-emerald-600', letter: '✓' },
      { label: 'Notion', bg: 'bg-violet-600', letter: 'N' },
      { label: 'Collaboration', bg: 'bg-gradient-to-r from-amber-400 to-rose-400', letter: '', textDark: true },
    ],
  },
  {
    id: 6,
    duration: 12,
    title: 'Final Prototype & Handoff',
    description:
      'Completed a high-fidelity prototype covering all app sections. Structured everything for smooth developer handoff.',
    icon: Home,
    dark: true,
    tools: [
      { label: 'Miro', bg: 'bg-amber-400', letter: 'M', textDark: true },
      { label: 'Notion', bg: 'bg-violet-600', letter: 'N' },
      { label: 'Figma', bg: 'bg-white', letter: 'F', textDark: true },
    ],
  },
] as const

function ToolBadge({
  bg,
  letter,
  textDark,
}: {
  bg: string
  letter: string
  textDark?: boolean
}) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center text-xs font-bold',
        bg,
        textDark ? 'text-stone-800' : 'text-white',
      )}
    >
      {letter || '•'}
    </div>
  )
}

function WorkflowCard({
  step,
}: {
  step: (typeof steps)[number]
}) {
  const isDark = step.dark
  const Icon = step.icon
  return (
    <div
      className={cn(
        'flex flex-col p-5',
        isDark ? cardBaseDark : cardBaseLight,
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center',
            isDark ? 'text-stone-300' : 'text-stone-600',
          )}
        >
          <Icon className="size-5" />
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            isDark ? 'text-stone-400' : 'text-stone-500',
          )}
        >
          {step.duration} days
        </span>
      </div>
      <h3
        className={cn(
          'mb-2 text-lg font-semibold',
          isDark ? 'text-white' : 'text-stone-900',
        )}
      >
        {step.title}
      </h3>
      <p
        className={cn(
          'mb-4 text-sm leading-relaxed',
          isDark ? 'text-stone-300' : 'text-stone-600',
        )}
      >
        {step.description}
      </p>
      <div className="mt-auto">
        <p
          className={cn(
            'mb-2 text-xs font-semibold uppercase tracking-wider',
            isDark ? 'text-stone-500' : 'text-stone-500',
          )}
        >
          Tools
        </p>
        <div className="flex flex-wrap gap-2">
          {step.tools.map((tool, i) => (
            <ToolBadge
              key={i}
              bg={tool.bg}
              letter={tool.letter}
              textDark={tool.textDark}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function MediquoWorkflowTimelineDemo() {
  return (
    <div className="space-y-6 bg-stone-100 p-6">
      <p className="text-sm text-stone-500">05 Timeline & Tools</p>
      <h2 className="text-2xl font-bold text-stone-900">
        Design Workflow
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <WorkflowCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  )
}
