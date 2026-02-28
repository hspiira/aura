/**
 * Currently selected performance cycle (for top bar and filters).
 */

import { Store } from '@tanstack/react-store'

export interface SelectedCycleState {
  cycleId: string | null
}

export const selectedCycleStore = new Store<SelectedCycleState>({ cycleId: null })

export function setSelectedCycleId(cycleId: string | null) {
  selectedCycleStore.setState(() => ({ cycleId }))
}

export function getSelectedCycleId(): string | null {
  return selectedCycleStore.state.cycleId
}
