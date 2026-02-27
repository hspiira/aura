'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { meQueryOptions } from '#/lib/queries'
import { performanceCyclesQueryOptions } from '#/lib/queries'
import { cn } from '#/lib/utils'
import { apiPost } from '#/lib/api'
import { clearAuth } from '#/stores/auth'
import { setSelectedCycleId } from '#/stores/selected-cycle'
import { useStore } from '@tanstack/react-store'
import { selectedCycleStore } from '#/stores/selected-cycle'

export function AppTopBar() {
  const { data: me } = useQuery(meQueryOptions())
  const { data: cycles } = useQuery(performanceCyclesQueryOptions())
  const selectedId = useStore(selectedCycleStore, (s) => s.cycleId)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (cycles?.length && selectedId === null) {
      setSelectedCycleId(cycles[0].id)
    }
  }, [cycles, selectedId])

  const selectedCycle = cycles?.find((c) => c.id === selectedId) ?? cycles?.[0] ?? null

  const userName = me?.user.name ?? 'User'
  const displayName = userName.trim() || 'User'

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-stone-200/80 bg-white px-4">
      <div className="min-w-0 flex-1" />

      <div className="flex items-center gap-3">
        {/* Cycle selector */}
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1.5 rounded-sm border border-stone-200 bg-stone-50/80 px-2.5 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-100',
              dropdownOpen && 'border-amber-400/60 bg-amber-50/50',
            )}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-label="Select performance cycle"
          >
            <span className="max-w-[10rem] truncate">
              {selectedCycle?.name ?? 'Select cycle'}
            </span>
            <ChevronDown className="size-4 shrink-0 text-stone-400" />
          </button>
          {dropdownOpen && (
            <ul
              role="listbox"
              className="absolute right-0 top-full z-50 mt-1 max-h-60 w-56 overflow-auto rounded-sm border border-stone-200 bg-white py-1 shadow-lg"
            >
              {cycles?.length ? (
                cycles.map((cycle) => (
                  <li key={cycle.id} role="option" aria-selected={cycle.id === selectedId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCycleId(cycle.id)
                        setDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm',
                        cycle.id === selectedId
                          ? 'bg-amber-50 text-amber-800'
                          : 'text-stone-700 hover:bg-stone-50',
                      )}
                    >
                      {cycle.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-stone-500">No cycles</li>
              )}
            </ul>
          )}
        </div>

        {/* Current user */}
        <span
          className="max-w-[8rem] truncate text-sm font-medium text-stone-700"
          title={displayName}
        >
          {displayName}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await apiPost('auth/logout')
            } catch {
              // ignore failures; client-side clear is enough
            }
            clearAuth()
            window.location.href = '/login'
          }}
          className="rounded-sm border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
