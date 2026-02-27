'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import type { ObjectiveAmend } from '#/lib/types'
import { apiPatch } from '#/lib/api'
import { queryKeys } from '#/lib/queries'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '#/components/ui/sheet'

interface AmendObjectiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectiveId: string
  currentTarget: string | null
  currentWeight: string
}

export function AmendObjectiveDrawer({
  open,
  onOpenChange,
  objectiveId,
  currentTarget,
  currentWeight,
}: AmendObjectiveDrawerProps) {
  const queryClient = useQueryClient()
  const [targetValue, setTargetValue] = useState(currentTarget ?? '')
  const [weight, setWeight] = useState(currentWeight ?? '')
  const [justification, setJustification] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTargetValue(currentTarget ?? '')
      setWeight(currentWeight ?? '')
      setJustification('')
      setError(null)
    }
  }, [open, currentTarget, currentWeight])

  const amendMutation = useMutation({
    mutationFn: (body: ObjectiveAmend) =>
      apiPatch<unknown, ObjectiveAmend>(`objectives/${objectiveId}/amend`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives.detail(objectiveId) })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      setTargetValue(currentTarget ?? '')
      setWeight(currentWeight ?? '')
      setJustification('')
      setError(null)
      onOpenChange(false)
    },
    onError: (err: { body?: { detail?: string | string[] }; status?: number }) => {
      const detail = err?.body?.detail
      setError(
        Array.isArray(detail) ? detail.join(' ') : typeof detail === 'string' ? detail : 'Failed to amend',
      )
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!justification.trim()) {
      setError('Justification is required.')
      return
    }
    setError(null)
    amendMutation.mutate({
      target_value: targetValue.trim() || null,
      weight: weight.trim() || null,
      justification: justification.trim(),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Amend objective</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-4">
          <div>
            <label htmlFor="amend-target" className="mb-1 block text-sm font-medium text-stone-700">
              Target value
            </label>
            <input
              id="amend-target"
              type="text"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="amend-weight" className="mb-1 block text-sm font-medium text-stone-700">
              Weight (%)
            </label>
            <input
              id="amend-weight"
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="amend-justification" className="mb-1 block text-sm font-medium text-stone-700">
              Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              id="amend-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <SheetFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={amendMutation.isPending}
              className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {amendMutation.isPending ? 'Saving…' : 'Save amendment'}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
