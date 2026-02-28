'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ObjectiveCreate, ObjectiveTemplateResponse } from '#/lib/types'
import { cn } from '#/lib/utils'
import { apiPost } from '#/lib/api'
import {
  objectiveTemplatesQueryOptions,
  objectivesQueryOptions,
  performanceCyclesQueryOptions,
} from '#/lib/queries'

interface NewObjectiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  performanceCycleId: string
}

const initialForm: Partial<ObjectiveCreate> = {
  title: '',
  description: '',
  dimension_id: '',
  template_id: null,
  kpi_type: null,
  target_value: null,
  unit_of_measure: null,
  weight: '',
  start_date: '',
  end_date: '',
}

export function NewObjectiveModal({
  open,
  onOpenChange,
  userId,
  performanceCycleId,
}: NewObjectiveModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<ObjectiveCreate>>(initialForm)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const { data: templates } = useQuery(objectiveTemplatesQueryOptions())
  const { data: cycles } = useQuery(performanceCyclesQueryOptions())
  const cycle = cycles?.find((c) => c.id === performanceCycleId)

  const createMutation = useMutation({
    mutationFn: (body: ObjectiveCreate) =>
      apiPost<unknown, ObjectiveCreate>('objectives', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      setForm(initialForm)
      setValidationErrors([])
      onOpenChange(false)
    },
    onError: (err: { body?: { detail?: string | string[] }; status?: number }) => {
      const detail = err?.body?.detail
      setValidationErrors(
        Array.isArray(detail) ? detail : typeof detail === 'string' ? [detail] : ['Failed to create objective'],
      )
    },
  })

  function handleTemplateSelect(template: ObjectiveTemplateResponse | null) {
    if (!template) {
      setForm((f) => ({ ...f, template_id: null, dimension_id: '', kpi_type: null, weight: '', title: f?.title || '' }))
      return
    }
    const weight =
      Number(template.default_weight) <= 1 && Number(template.default_weight) > 0
        ? String(Number(template.default_weight) * 100)
        : String(template.default_weight)
    setForm((f) => ({
      ...f,
      template_id: template.id,
      dimension_id: template.dimension_id,
      kpi_type: template.kpi_type ?? null,
      weight,
      title: template.title,
      description: template.description ?? undefined,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !performanceCycleId || !form.dimension_id || !form.title || !form.weight || !form.start_date || !form.end_date) {
      setValidationErrors(['Fill in required fields: title, dimension, weight, start date, end date.'])
      return
    }
    setValidationErrors([])
    createMutation.mutate({
      user_id: userId,
      performance_cycle_id: performanceCycleId,
      dimension_id: form.dimension_id,
      template_id: form.template_id ?? undefined,
      title: form.title,
      description: form.description ?? undefined,
      kpi_type: form.kpi_type ?? undefined,
      target_value: form.target_value ?? undefined,
      unit_of_measure: form.unit_of_measure ?? undefined,
      weight: form.weight,
      start_date: form.start_date,
      end_date: form.end_date,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-objective-title"
        className="relative w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl"
      >
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 id="new-objective-title" className="text-lg font-semibold text-stone-900">
            New objective
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Template (optional)
            </label>
            <select
              value={form.template_id ?? ''}
              onChange={(e) => {
                const t = templates?.find((x) => x.id === e.target.value) ?? null
                handleTemplateSelect(t)
              }}
              className="w-full rounded border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {templates?.filter((t) => t.is_active).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Description
            </label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Weight % <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.weight ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                KPI type
              </label>
              <input
                value={form.kpi_type ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, kpi_type: e.target.value || undefined }))}
                className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Start date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date ?? cycle?.start_date ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                End date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.end_date ?? cycle?.end_date ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Target value
            </label>
            <input
              type="text"
              value={form.target_value ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value || undefined }))}
              className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Unit of measure
            </label>
            <input
              value={form.unit_of_measure ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, unit_of_measure: e.target.value || undefined }))}
              className="w-full rounded border border-stone-200 px-3 py-2 text-sm"
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              <ul className="list-inside list-disc">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={cn(
                'rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-800 disabled:opacity-60',
              )}
            >
              {createMutation.isPending ? 'Creating…' : 'Create objective'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
